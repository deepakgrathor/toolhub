import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import type { TitleGeneratorInput } from "./schema";

const STYLE_LABELS: Record<string, string> = {
  clickbait: "attention-grabbing clickbait",
  informative: "informative and factual",
  question: "question-based",
  howto: "how-to and tutorial",
  listicle: "listicle (numbered list format)",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  blog: "Blog",
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  instagram: "Instagram",
};

function buildPrompt(input: TitleGeneratorInput): string {
  return `Generate ${input.count} ${STYLE_LABELS[input.style]} titles for ${PLATFORM_LABELS[input.platform]} content about: "${input.topic}"

Rules:
- Each title optimised for ${PLATFORM_LABELS[input.platform]} audience
- Style must be ${STYLE_LABELS[input.style]}
- Titles should drive clicks and engagement
- Indian context and audience where relevant
- No numbering or bullet symbols in the titles themselves
- Vary the phrasing across titles

Return ONLY this JSON, no markdown:
{"titles":["title1","title2",...]}`;
}

export async function execute(
  input: TitleGeneratorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 1;
  const aiModel = toolConfigDoc?.aiModel ?? "gemini-flash-2.0";
  const aiProvider = toolConfigDoc?.aiProvider ?? "google";

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

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: applyWatermark(JSON.stringify(parsed), context.planSlug ?? "free", context.toolSlug),
    creditsUsed: creditCost,
  });

  return { output: JSON.stringify(parsed), structured: parsed, creditsUsed: creditCost, newBalance };
}
