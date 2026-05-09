import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { callAI, extractJson } from "@/lib/ai";
import type { LegalNoticeInput } from "./schema";

const NOTICE_LABELS: Record<string, string> = {
  "payment-recovery": "Payment Recovery Notice",
  "property-dispute": "Property Dispute Notice",
  "service-deficiency": "Notice for Deficiency in Service",
  "cheque-bounce": "Notice for Dishonour of Cheque (Section 138 NI Act)",
  "employment": "Employment-related Legal Notice",
};

function buildPrompt(input: LegalNoticeInput): string {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `You are an Indian legal expert. Draft a formal legal notice as follows:

Notice Type: ${NOTICE_LABELS[input.noticeType]}
Date: ${today}

SENDER (Noticee/Client):
Name: ${input.senderName}
Address: ${input.senderAddress}

RECEIVER (Opposite Party):
Name: ${input.receiverName}
Address: ${input.receiverAddress}

Subject: ${input.subject}

Incident Details:
${input.incidentDetails}

Demands:
${input.demand}

Response Deadline: ${input.deadlineDays} days from receipt of this notice

Instructions:
- Write in formal legal English suitable for Indian courts/disputes
- Include standard legal notice language and citations where appropriate
- Structure: Opening, Facts, Legal Basis, Demand, Deadline, Consequence of non-compliance
- Include "Without Prejudice" header
- End with sender's signature block
- Write as a complete, ready-to-send legal notice

Return ONLY this JSON, no markdown:
{
  "subject": "Re: Legal Notice for ${input.subject}",
  "noticeText": "COMPLETE FORMAL NOTICE TEXT HERE (use \\n for line breaks)",
  "summary": "2-3 sentence plain-English summary of what this notice demands"
}`;
}

export async function execute(
  input: LegalNoticeInput,
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

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: JSON.stringify(parsed),
    creditsUsed: creditCost,
  });

  return { output: JSON.stringify(parsed), structured: parsed, creditsUsed: creditCost, newBalance };
}
