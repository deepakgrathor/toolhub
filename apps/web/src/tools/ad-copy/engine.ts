import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { callAI, extractJson } from "@/lib/ai";
import type { AdCopyInput } from "./schema";

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google Search",
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
};

const GOAL_LABELS: Record<string, string> = {
  awareness: "Brand Awareness",
  leads: "Lead Generation",
  sales: "Direct Sales / Conversions",
  traffic: "Website Traffic",
  engagement: "Engagement & Reach",
};

function buildPrompt(input: AdCopyInput): string {
  return `Write 3 high-converting ad copy variations for the following:

Product/Service: ${input.productName}
Description: ${input.productDescription}
Target Audience: ${input.targetAudience}
Platform: ${PLATFORM_LABELS[input.platform]}
Campaign Goal: ${GOAL_LABELS[input.goal]}
Unique Selling Point (USP): ${input.usp}

Requirements:
- 3 distinctly different creative approaches (e.g. Emotional Appeal, Social Proof, Urgency/FOMO)
- Each ad optimised for ${PLATFORM_LABELS[input.platform]} character limits and audience behaviour
- Headline: max 30 words, punchy
- Primary text: 50-100 words
- CTA: short action phrase (e.g. "Shop Now", "Get Free Demo", "Learn More")
- Indian audience and market context
- Goal: ${GOAL_LABELS[input.goal]}

Return ONLY this JSON, no markdown:
{
  "ads": [
    {"variant":"Approach Name","headline":"...","primaryText":"...","cta":"..."},
    {"variant":"Approach Name","headline":"...","primaryText":"...","cta":"..."},
    {"variant":"Approach Name","headline":"...","primaryText":"...","cta":"..."}
  ]
}`;
}

export async function execute(
  input: AdCopyInput,
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

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: JSON.stringify(parsed),
    creditsUsed: creditCost,
  });

  return { output: JSON.stringify(parsed), structured: parsed, creditsUsed: creditCost, newBalance };
}
