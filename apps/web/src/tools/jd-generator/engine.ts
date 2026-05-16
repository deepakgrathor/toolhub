import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import { invalidateBalance } from "@/lib/credit-cache";
import type { JdGeneratorInput } from "./schema";

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: "0-2 years (Entry Level)",
  mid: "3-5 years (Mid Level)",
  senior: "5-8 years (Senior Level)",
  lead: "8+ years (Lead/Principal)",
};

function buildPrompt(input: JdGeneratorInput): string {
  return `You are an expert HR professional in India. Write a complete, professional job description.

Job Title: ${input.jobTitle}
Department: ${input.department}
Experience Required: ${EXPERIENCE_LABELS[input.experienceLevel]}
Work Type: ${input.workType}
Location: ${input.location || "India"}
Required Skills: ${input.skills}
Company Context: ${input.companyContext || "A fast-growing Indian tech startup"}

Generate a structured JD with:
- overview: 2-3 sentences about the role
- responsibilities: array of 6-8 bullet points
- requirements: array of 5-7 must-have qualifications
- niceToHave: array of 3-4 good-to-have skills
- benefits: array of 4-5 benefits (include standard Indian perks like health insurance, leave policy)

Rules:
- All array items: plain strings, no bullet symbols
- Professional tone, Indian workplace context
- requirements must include the experience level and skills listed

Return ONLY this JSON, no markdown:
{"title":"${input.jobTitle}","overview":"...","responsibilities":["..."],"requirements":["..."],"niceToHave":["..."],"benefits":["..."],"location":"${input.location || "India"}","workType":"${input.workType}","department":"${input.department}"}`;
}

export async function execute(
  input: JdGeneratorInput,
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
