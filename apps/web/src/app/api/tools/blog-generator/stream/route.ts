import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditService, ToolConfig, ToolOutput, InsufficientCreditsError } from "@toolhub/db";
import { blogGeneratorSchema } from "@/tools/blog-generator/schema";
import { runToolGuard } from "@/lib/tool-guard";
import { callAIStream } from "@/lib/ai-stream";
import { sanitizeUserInput } from "@/lib/prompt-sanitizer";
import { invalidateBalance } from "@/lib/credit-cache";
import type { BlogGeneratorInput } from "@/tools/blog-generator/schema";

export const dynamic = "force-dynamic";

// Returns plain-text markdown — better UX for streaming than JSON
function buildStreamingPrompt(input: BlogGeneratorInput): string {
  const LENGTH_WORDS = { short: 500, medium: 1000, long: 1500 } as const;
  const SECTIONS_COUNT = { short: 3, medium: 4, long: 6 } as const;

  const wordTarget = LENGTH_WORDS[input.length];
  const sectionCount = SECTIONS_COUNT[input.length];
  const wordsPerSection = Math.floor((wordTarget * 0.7) / sectionCount);

  const topic = sanitizeUserInput(input.topic);
  const tone = sanitizeUserInput(input.tone);
  const targetAudience = sanitizeUserInput(input.targetAudience || "general");
  const keywords = sanitizeUserInput(input.keywords || "none");

  return `You are an expert blog writer for Indian audiences. Write a structured blog post in plain text with exact section markers.

Topic: ${topic}
Tone: ${tone}
Target audience: ${targetAudience}
Keywords to include naturally: ${keywords}

Write ${sectionCount} sections, each ~${wordsPerSection} words. Use EXACTLY this format with no deviation:

TITLE: [write the blog title here]

META: [write meta description max 155 chars here]

---SECTION---
## [Section heading]
[Section content — plain prose, no bullet points, ${wordsPerSection} words]

---SECTION---
## [Section heading]
[Section content — plain prose, ${wordsPerSection} words]

(repeat ---SECTION--- blocks for all ${sectionCount} sections)

---CONCLUSION---
[Conclusion paragraph ~80 words]

---CTA---
[One short call-to-action sentence]

Write the full blog now. Do not add any explanation before or after.`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const guard = await runToolGuard(session.user.id, "blog-generator");
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = blogGeneratorSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid input", { status: 400 });
  }

  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: "blog-generator" })
    .select("creditCost aiModel aiProvider isActive")
    .lean();

  if (toolConfigDoc && !toolConfigDoc.isActive) {
    return new Response(
      JSON.stringify({ error: "Tool is not available" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const creditCost = toolConfigDoc?.creditCost ?? 3;
  const aiModel = toolConfigDoc?.aiModel ?? "gpt-4o-mini";
  const aiProvider = toolConfigDoc?.aiProvider ?? "openai";

  // Check balance before streaming (don't deduct yet)
  const hasBalance = await CreditService.checkBalance(session.user.id, creditCost);
  if (!hasBalance) {
    return new Response(
      JSON.stringify({ error: "insufficient_credits" }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  const prompt = buildStreamingPrompt(parsed.data);
  const userId = session.user.id;

  // Build a ReadableStream that pipes AI chunks to the client
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const fullText = await callAIStream(
          prompt,
          aiModel,
          aiProvider,
          (chunk) => {
            controller.enqueue(encoder.encode(chunk));
          }
        );

        // Deduct credits ONLY after successful stream
        const { newBalance } = await CreditService.deductCredits(
          userId,
          creditCost,
          "blog-generator"
        );
        await invalidateBalance(userId);

        await ToolOutput.create({
          userId,
          toolSlug: "blog-generator",
          inputSnapshot: parsed.data,
          outputText: fullText,
          creditsUsed: creditCost,
        });

        // Send terminal metadata so the client knows we're done
        const terminal = `\n\n[DONE:${JSON.stringify({ creditsUsed: creditCost, newBalance })}]`;
        controller.enqueue(encoder.encode(terminal));
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          controller.enqueue(
            encoder.encode(`\n\n[ERROR:{"code":"insufficient_credits"}]`)
          );
        } else {
          console.error("[stream/blog-generator]", err);
          controller.enqueue(
            encoder.encode(`\n\n[ERROR:{"code":"generation_failed"}]`)
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}
