import { connectDB, CreditService, InsufficientCreditsError, ToolOutput } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import type { BlogGeneratorInput } from "./schema";

const LENGTH_WORDS = { short: 500, medium: 1000, long: 1500 } as const;

function buildPrompt(input: BlogGeneratorInput): string {
  const wordTarget = LENGTH_WORDS[input.length];
  return `You are an expert blog writer for Indian audiences.
Write a ${wordTarget}-word blog post about: ${input.topic}
Tone: ${input.tone}
Target audience: ${input.targetAudience || "general"}
Include these keywords naturally: ${input.keywords || "none"}

Respond in this exact JSON format:
{
  "title": "string",
  "metaDescription": "string (max 160 chars)",
  "sections": [
    { "heading": "string", "content": "string" }
  ],
  "conclusion": "string",
  "cta": "string",
  "wordCount": number
}

JSON only. No markdown. No preamble.`;
}

export async function execute(
  input: BlogGeneratorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const hasBalance = await CreditService.checkBalance(context.userId, 3);
  if (!hasBalance) {
    const balance = await CreditService.getBalance(context.userId);
    throw new InsufficientCreditsError(balance, 3);
  }

  const prompt = buildPrompt(input);

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!aiRes.ok) {
    throw new Error("AI service failed");
  }

  const data = await aiRes.json();
  const raw = data?.choices?.[0]?.message?.content;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid AI response");
  }

  // Deduct ONLY after successful parse
  const { newBalance } = await CreditService.deductCredits(
    context.userId,
    3,
    "blog-generator"
  );

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: "blog-generator",
    inputSnapshot: input,
    outputText: JSON.stringify(parsed),
    creditsUsed: 3,
  });

  return {
    output: JSON.stringify(parsed),
    structured: parsed,
    creditsUsed: 3,
    newBalance,
  };
}
