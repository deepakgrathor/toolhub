import { connectDB, CreditService, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { callAI, extractJson } from "@/lib/ai";
import type { HookWriterInput } from "./schema";

function buildPrompt(input: HookWriterInput): string {
  const count = parseInt(input.count, 10);
  const platformMap: Record<string, string> = {
    instagram: "Instagram Reels",
    youtube: "YouTube videos",
    linkedin: "LinkedIn posts",
    twitter: "Twitter/X threads",
  };
  return `You are a viral social media copywriter. Generate ${count} attention-grabbing opening hooks for ${platformMap[input.platform]} about the topic: "${input.topic}".

Rules:
- Each hook must be 1-2 sentences max
- Make them scroll-stopping and curiosity-driven
- Tailor style to ${platformMap[input.platform]} audience
- Indian context where relevant

Return ONLY this JSON, no markdown:
{"hooks":["hook 1","hook 2",...]}`;
}

export async function execute(
  input: HookWriterInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 0;
  const aiModel = toolConfigDoc?.aiModel ?? "gpt-4o-mini";
  const aiProvider = toolConfigDoc?.aiProvider ?? "openai";

  const raw = await callAI(buildPrompt(input), aiModel, aiProvider);
  const parsed = extractJson(raw);

  if (creditCost > 0) {
    const hasBalance = await CreditService.checkBalance(context.userId, creditCost);
    if (!hasBalance) {
      const { InsufficientCreditsError } = await import("@toolhub/db");
      const balance = await CreditService.getBalance(context.userId);
      throw new InsufficientCreditsError(balance, creditCost);
    }
  }

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
