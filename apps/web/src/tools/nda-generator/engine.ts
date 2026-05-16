import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import { invalidateBalance } from "@/lib/credit-cache";
import type { NdaGeneratorInput } from "./schema";

const DURATION_LABELS: Record<string, string> = {
  "6": "6 (six) months",
  "12": "1 (one) year",
  "24": "2 (two) years",
  "36": "3 (three) years",
};

function buildPrompt(input: NdaGeneratorInput): string {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const ndaTypeLabel =
    input.ndaType === "mutual"
      ? "Mutual Non-Disclosure Agreement (both parties disclose and receive confidential information)"
      : "One-Way Non-Disclosure Agreement (Party A discloses to Party B only)";

  return `You are an Indian legal expert. Draft a complete, professional Non-Disclosure Agreement (NDA) under Indian law.

Date: ${today}

PARTY A (${input.ndaType === "one-way" ? "Disclosing Party" : "First Party"}):
Name: ${input.partyAName}
Address: ${input.partyAAddress}

PARTY B (${input.ndaType === "one-way" ? "Receiving Party" : "Second Party"}):
Name: ${input.partyBName}
Address: ${input.partyBAddress}

NDA Type: ${ndaTypeLabel}

Purpose of Disclosure:
${input.purpose}

Confidentiality Duration: ${DURATION_LABELS[input.durationMonths]}
Governing Law & Jurisdiction: ${input.jurisdiction}, India

Requirements:
- Complete NDA with all standard clauses under Indian Contract Act, 1872
- Include: Definitions, Obligations, Exclusions, Term, Return of Information, Remedies, Governing Law
- Professional formal legal language
- Ready to sign with signature blocks for both parties
- Include clause numbers for each section

Return ONLY this JSON, no markdown:
{
  "ndaText": "COMPLETE NDA DOCUMENT HERE (use \\n for line breaks, \\n\\n for paragraph breaks)",
  "summary": "2-3 sentence plain-English summary of what this NDA covers and protects"
}`;
}

export async function execute(
  input: NdaGeneratorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 12;
  const aiModel = toolConfigDoc?.aiModel ?? "claude-sonnet-4-5";
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
