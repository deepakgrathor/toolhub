import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { callAI, extractJson } from "@/lib/ai";
import type { AppraisalDraftInput } from "./schema";

const RATING_LABELS: Record<string, string> = {
  exceptional: "Exceptional (5/5)",
  exceeds: "Exceeds Expectations (4/5)",
  meets: "Meets Expectations (3/5)",
  below: "Below Expectations (2/5)",
  unsatisfactory: "Unsatisfactory (1/5)",
};

function buildPrompt(input: AppraisalDraftInput): string {
  return `You are an experienced HR manager writing a structured performance appraisal.

Employee: ${input.employeeName}
Role: ${input.role}
Review Period: ${input.reviewPeriod}
Overall Rating: ${RATING_LABELS[input.rating]}
Manager: ${input.managerName}
Tone: ${input.tone}

Key Achievements:
${input.achievements}

Areas Needing Improvement:
${input.areasOfImprovement}

Write a professional performance appraisal with a ${input.tone} tone. The improvementSection should be constructive and forward-looking, never harsh.

Return ONLY this JSON, no markdown:
{"summary":"2-3 sentence executive summary of overall performance","strengthsSection":"3-4 paragraph section highlighting strengths and achievements in detail","improvementSection":"2-3 paragraph section on development areas using growth-oriented language","goalsSection":"3-4 specific SMART goals for the next review period as a formatted list","overallRating":"${RATING_LABELS[input.rating]}","fullAppraisal":"Complete formatted appraisal combining all sections with headings: Performance Summary, Key Strengths, Areas for Development, Goals for Next Period, Overall Rating"}`;
}

export async function execute(
  input: AppraisalDraftInput,
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
