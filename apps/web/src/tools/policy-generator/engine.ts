import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import type { PolicyGeneratorInput } from "./schema";

const POLICY_LABELS: Record<string, string> = {
  "leave-policy": "Leave Policy",
  "work-from-home": "Work From Home Policy",
  "code-of-conduct": "Code of Conduct",
  "data-privacy": "Data Privacy Policy",
  "expense-reimbursement": "Expense Reimbursement Policy",
  "anti-harassment": "Anti-Harassment Policy",
  "social-media": "Social Media Policy",
  "attendance": "Attendance Policy",
};

const COMPANY_SIZE_LABELS: Record<string, string> = {
  startup: "Startup (< 10 employees)",
  small: "Small Business (10-50 employees)",
  medium: "Medium Business (50-500 employees)",
  enterprise: "Enterprise (500+ employees)",
};

function buildPrompt(input: PolicyGeneratorInput): string {
  return `You are an experienced HR consultant writing a professional company policy document for an Indian organisation.

Company: ${input.companyName}
Policy Type: ${POLICY_LABELS[input.policyType]}
Company Size: ${COMPANY_SIZE_LABELS[input.companySize]}
Industry: ${input.industry}
${input.additionalPoints ? `Additional Requirements:\n${input.additionalPoints}` : ""}

Write a comprehensive, professional ${POLICY_LABELS[input.policyType]} document. Include all relevant clauses appropriate for an Indian company of this size and industry. Reference Indian labour laws where applicable.

Return ONLY this JSON, no markdown:
{"policyTitle":"Full official policy title","sections":[{"heading":"Section heading","content":"Section content in 2-4 paragraphs"}],"fullPolicy":"Complete formatted policy document with all sections, policy number, effective date as [DATE], and signature block"}

Include 6-8 sections covering: purpose, scope, policy statement, procedures, responsibilities, compliance/consequences, and any policy-specific sections.`;
}

export async function execute(
  input: PolicyGeneratorInput,
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
    outputText: applyWatermark(JSON.stringify(parsed), context.planSlug ?? "free", context.toolSlug),
    creditsUsed: creditCost,
  });

  return { output: JSON.stringify(parsed), structured: parsed, creditsUsed: creditCost, newBalance };
}
