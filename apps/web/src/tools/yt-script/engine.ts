import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import { invalidateBalance } from "@/lib/credit-cache";
import type { YtScriptInput } from "./schema";

const WORDS_PER_MINUTE = 130;

function buildPrompt(input: YtScriptInput): string {
  const dur = parseInt(input.duration, 10);
  const totalWords = dur * WORDS_PER_MINUTE;
  const segmentCount = dur <= 5 ? 3 : dur <= 10 ? 4 : 5;
  const wordsPerSegment = Math.floor((totalWords * 0.7) / segmentCount);

  return `You are a top YouTube scriptwriter for Indian creators. Write a complete ${dur}-minute YouTube script.

Video Title: ${input.videoTitle}
Style: ${input.style}
Target audience: ${input.targetAudience || "general Indian YouTube viewers"}
Keywords to weave in: ${input.keywords || "none"}
Estimated total words: ~${totalWords}

Script structure:
- hook: 1-2 scroll-stopping opening sentences (speak directly to viewer pain/curiosity)
- intro: introduce yourself and video promise (~30 seconds)
- ${segmentCount} segments, each with a heading and ~${wordsPerSegment} words of content
- outro: wrap up + subscribe ask
- cta: one specific call-to-action

Rules:
- Write in conversational Hindi-English (Hinglish) mix only if style = entertaining, else pure English
- Each segment "content": plain text, no bullet points, no newlines inside
- All strings must be valid JSON

Return ONLY this JSON, no markdown:
{"hook":"...","intro":"...","segments":[{"heading":"...","content":"..."}],"outro":"...","cta":"...","estimatedDuration":${dur},"wordCount":${totalWords}}`;
}

export async function execute(
  input: YtScriptInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 4;
  const aiModel = toolConfigDoc?.aiModel ?? "gpt-4o-mini";
  const aiProvider = toolConfigDoc?.aiProvider ?? "openai";

  const hasBalance = await CreditService.checkBalance(context.userId, creditCost);
  if (!hasBalance) {
    const balance = await CreditService.getBalance(context.userId);
    throw new InsufficientCreditsError(balance, creditCost);
  }

  const raw = await callAI(buildPrompt(input), aiModel, aiProvider);
  const parsed = extractJson(raw);

  const { newBalance } = await CreditService.deductCredits(
    context.userId,
    creditCost,
    context.toolSlug
  );
  await invalidateBalance(context.userId);

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: applyWatermark(JSON.stringify(parsed), context.planSlug ?? "free", context.toolSlug),
    creditsUsed: creditCost,
  });

  return { output: JSON.stringify(parsed), structured: parsed, creditsUsed: creditCost, newBalance };
}
