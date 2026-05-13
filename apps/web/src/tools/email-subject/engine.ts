import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import type { EmailSubjectInput } from "./schema";

function buildPrompt(input: EmailSubjectInput): string {
  return `Generate ${input.count} email subject lines for the following email:

Email goal/content: "${input.emailGoal}"
Tone: ${input.tone}

Rules:
- Each subject line optimised for high open rates
- Tone must be ${input.tone}
- Keep each subject under 60 characters where possible
- Vary the approach across subject lines (curiosity, benefit, urgency etc.)
- Indian business context where relevant
- No numbering or symbols before the subject lines themselves

Return ONLY this JSON, no markdown:
{"subjects":["subject1","subject2",...]}`;
}

export async function execute(
  input: EmailSubjectInput,
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
