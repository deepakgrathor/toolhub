import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import { invalidateBalance } from "@/lib/credit-cache";
import type { ResumeScreenerInput } from "./schema";

function buildPrompt(input: ResumeScreenerInput): string {
  return `You are an expert HR recruiter. Analyse this resume against the job description and provide a detailed screening report.

RESUME:
${input.resumeText}

JOB DESCRIPTION:
${input.jobDescription}

Provide a structured analysis:
1. matchScore: 0-100 number representing overall fit
2. verdict: one of "strong-match" (>70), "good-match" (50-70), "weak-match" (30-50), "no-match" (<30)
3. keyMatches: 4-6 specific skills/experiences where candidate matches JD
4. gaps: 3-5 specific skills/requirements the candidate is missing
5. recommendation: 2-3 sentence hiring recommendation
6. interviewQuestions: 4-5 targeted interview questions based on gaps or areas to probe

Return ONLY this JSON, no markdown:
{
  "matchScore": 75,
  "verdict": "good-match",
  "keyMatches": ["skill1","skill2"],
  "gaps": ["gap1","gap2"],
  "recommendation": "...",
  "interviewQuestions": ["Q1?","Q2?"]
}`;
}

export async function execute(
  input: ResumeScreenerInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 3;
  const aiModel = toolConfigDoc?.aiModel ?? "claude-haiku-3-5";
  const aiProvider = toolConfigDoc?.aiProvider ?? "anthropic";

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
