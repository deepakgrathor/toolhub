import { connectDB, CreditService, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import type { CaptionGeneratorInput } from "./schema";

function buildPrompt(input: CaptionGeneratorInput): string {
  const platformMap: Record<string, string> = {
    instagram: "Instagram",
    linkedin: "LinkedIn",
    twitter: "Twitter/X",
    facebook: "Facebook",
  };
  const hashtagNote = input.includeHashtags
    ? "Include 5-8 relevant hashtags in the hashtags array."
    : "Leave the hashtags array empty.";

  return `You are a social media expert. Generate 3 engaging ${platformMap[input.platform]} captions for the topic: "${input.topic}".

Tone: ${input.tone}
${hashtagNote}

Rules:
- Each caption should feel native to ${platformMap[input.platform]}
- Include a call-to-action in each caption
- Indian context where relevant
- caption field: plain text only

Return ONLY this JSON, no markdown:
{"captions":[{"text":"caption text","hashtags":["tag1","tag2"]},{"text":"caption 2","hashtags":[]},{"text":"caption 3","hashtags":[]}]}`;
}

export async function execute(
  input: CaptionGeneratorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 0;
  const aiModel = toolConfigDoc?.aiModel ?? "gpt-4o-mini";
  const aiProvider = toolConfigDoc?.aiProvider ?? "openai";

  const raw = await callAI(buildPrompt(input), aiModel, aiProvider);
  const parsed = extractJson(raw);

  if (creditCost > 0) {
    const hasBalance = await CreditService.checkBalance(context.userId, creditCost);
    if (!hasBalance) {
      const { InsufficientCreditsError } = await import("@toolhub/db");
      const balance = await CreditService.getBalance(context.userId);
      throw new InsufficientCreditsError(balance, creditCost);
    }
  }

  const { newBalance } = await CreditService.deductCredits(
    context.userId,
    creditCost,
    context.toolSlug
  );

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: applyWatermark(JSON.stringify(parsed), context.planSlug ?? "free", context.toolSlug),
    creditsUsed: creditCost,
  });

  return { output: JSON.stringify(parsed), structured: parsed, creditsUsed: creditCost, newBalance };
}
