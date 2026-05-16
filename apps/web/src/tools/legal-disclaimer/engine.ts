import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import { invalidateBalance } from "@/lib/credit-cache";
import type { LegalDisclaimerInput } from "./schema";

const DISCLAIMER_LABELS: Record<string, string> = {
  "general-website": "General Website Disclaimer",
  "medical-health": "Medical / Health Information Disclaimer",
  "financial-investment": "Financial / Investment Information Disclaimer",
  "affiliate-marketing": "Affiliate Marketing & Sponsored Content Disclaimer",
  "ai-generated-content": "AI-Generated Content Disclaimer",
};

function buildPrompt(input: LegalDisclaimerInput): string {
  return `Write a professional legal disclaimer for the following:

Business/Website: ${input.businessType}
${input.websiteUrl ? `Website URL: ${input.websiteUrl}` : ""}
Disclaimer Type: ${DISCLAIMER_LABELS[input.disclaimerType]}
${input.additionalInfo ? `Additional context: ${input.additionalInfo}` : ""}

Requirements:
- Professional legal language appropriate for India
- Comprehensive coverage of the disclaimer type
- Include limitation of liability, accuracy of information, and no professional advice clauses as appropriate
- Ready to use on a website, app, or document
- 150-300 words

Return ONLY this JSON, no markdown:
{"disclaimerText": "DISCLAIMER TEXT HERE"}`;
}

export async function execute(
  input: LegalDisclaimerInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 3;
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
