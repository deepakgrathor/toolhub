import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { callAI, extractJson } from "@/lib/ai";
import type { WhatsappBulkInput } from "./schema";

const GOAL_LABELS: Record<string, string> = {
  promotion: "promotional offer",
  reminder: "payment/appointment reminder",
  announcement: "important announcement",
  followup: "follow-up",
  greeting: "festive greeting or welcome",
};

function buildPrompt(input: WhatsappBulkInput): string {
  const emojiInstruction = input.includeEmoji
    ? "Include relevant emojis to make the message engaging."
    : "Do NOT use any emojis.";

  return `Generate 5 WhatsApp bulk message templates for a ${input.businessType} business.

Message purpose: ${GOAL_LABELS[input.messageGoal]}
${input.offer ? `Offer/detail to include: ${input.offer}` : ""}
${emojiInstruction}

Rules:
- Each message must be ready to copy-paste directly into WhatsApp
- Keep each message concise (max 300 characters)
- Conversational and friendly Indian business tone
- Each message must be meaningfully different in approach
- Messages should feel personal, not generic bulk spam
- End with a soft call-to-action

Return ONLY this JSON, no markdown:
{"messages":["message1","message2","message3","message4","message5"]}`;
}

export async function execute(
  input: WhatsappBulkInput,
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
    outputText: JSON.stringify(parsed),
    creditsUsed: creditCost,
  });

  return { output: JSON.stringify(parsed), structured: parsed, creditsUsed: creditCost, newBalance };
}
