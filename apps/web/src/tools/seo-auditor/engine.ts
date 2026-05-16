import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import { invalidateBalance } from "@/lib/credit-cache";
import type { SeoAuditorInput } from "./schema";

function buildPrompt(input: SeoAuditorInput): string {
  return `You are an expert SEO consultant. Analyse this website and provide a comprehensive SEO audit based on the URL structure, business type, and keywords.

Website URL: ${input.websiteUrl}
Business Type: ${input.businessType}
Target Keywords: ${input.targetKeywords}
${input.competitors ? `Competitors: ${input.competitors}` : ""}

Provide actionable, specific SEO recommendations. Base your analysis on the URL structure, domain patterns, likely page structure for this type of business, and keyword optimisation opportunities.

Return ONLY this JSON, no markdown:
{
  "overallScore": <number 0-100>,
  "categories": [
    {
      "name": "On-Page SEO",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<2-4 specific issues>],
      "recommendations": [<2-4 actionable recommendations>]
    },
    {
      "name": "Content Quality",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<2-4 specific issues>],
      "recommendations": [<2-4 actionable recommendations>]
    },
    {
      "name": "Technical SEO",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<2-4 specific issues>],
      "recommendations": [<2-4 actionable recommendations>]
    },
    {
      "name": "Mobile Optimisation",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<1-3 specific issues>],
      "recommendations": [<1-3 actionable recommendations>]
    },
    {
      "name": "Page Speed",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<1-3 specific issues>],
      "recommendations": [<1-3 actionable recommendations>]
    },
    {
      "name": "Keyword Usage",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<2-3 specific issues referencing the provided keywords>],
      "recommendations": [<2-3 actionable recommendations>]
    },
    {
      "name": "Meta Tags",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<2-3 specific issues>],
      "recommendations": [<2-3 actionable recommendations>]
    },
    {
      "name": "Internal Linking",
      "score": <0-100>,
      "status": <"good"|"warning"|"poor">,
      "issues": [<1-3 specific issues>],
      "recommendations": [<1-3 actionable recommendations>]
    }
  ],
  "quickWins": [<4-6 quick wins that can be implemented immediately>],
  "priorityActions": [<4-6 high-impact priority actions as numbered strings>]
}

Rules:
- status is "good" if score >= 70, "warning" if 40-69, "poor" if < 40
- Make issues and recommendations specific to this business type and keywords
- quickWins should be achievable within 1-2 days
- priorityActions should be numbered: "1. Action name", "2. Action name" etc`;
}

export async function execute(
  input: SeoAuditorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 8;
  const aiModel = toolConfigDoc?.aiModel ?? "gpt-4o";
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
