import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { applyWatermark } from "@/lib/watermark";
import { callAI, extractJson } from "@/lib/ai";
import type { LinkedinBioInput } from "./schema";

function buildPrompt(input: LinkedinBioInput): string {
  return `You are a LinkedIn personal branding expert. Generate 3 distinct LinkedIn bio/About section variants for a professional.

Name: ${input.name}
Current Role: ${input.currentRole}
Industry: ${input.industry}
Top Skills: ${input.topSkills}
Career Highlight: ${input.careerHighlight || "not specified"}
Years of Experience: ${input.yearsOfExperience || "not specified"}

Generate 3 bio variants:
1. concise: 50-70 words, punchy, keyword-rich for LinkedIn search
2. storytelling: 100-120 words, narrative style, starts with a hook
3. professional: 80-100 words, achievement-focused, third-person optional

Rules:
- Indian professional context
- No clichés like "passionate about" or "results-driven"
- Each bio must feel distinct in style
- All strings must be valid JSON (escape quotes)

Return ONLY this JSON, no markdown:
{"concise":"...","storytelling":"...","professional":"..."}`;
}

export async function execute(
  input: LinkedinBioInput,
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
