import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
// TODO: migrate remaining NextResponse.json calls to ApiResponse helpers
import { connectDB, Tool, User, CreditService, ToolOutput } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { checkAbuseLimit } from "@/lib/abuse-protection";
import { applyWatermark } from "@/lib/watermark";
import { getUserPlan } from "@/lib/user-plan";
import { checkAndSendCreditAlert } from "@/lib/credit-alerts";
import { sanitizeInputsObject } from "@/lib/prompt-sanitizer";
import { invalidateBalance } from "@/lib/credit-cache";

export const dynamic = "force-dynamic";

const AI_MODELS = [
  "claude-haiku-3-5", "claude-sonnet-4-5",
  "gpt-4o-mini", "gpt-4o",
  "gemini-flash-2.0", "gpt-image-1",
];

type ToolDoc = {
  slug: string;
  name: string;
  type: string;
  systemPrompt: string;
  promptTemplate: string;
  formFields: Array<{ key: string; label: string; required?: boolean }>;
  outputType: string;
  aiModel: string;
  maxOutputTokens: number;
  temperature: number;
};

async function callModel(
  tool: ToolDoc,
  prompt: string
): Promise<string> {
  const {
    aiModel,
    systemPrompt,
    maxOutputTokens = 2000,
    temperature = 0.7,
  } = tool;

  const model = AI_MODELS.includes(aiModel) ? aiModel : "gemini-flash-2.0";

  // ── LiteLLM gateway (if configured) ────────────────────────────────────────
  const gatewayUrl = process.env.LITELLM_GATEWAY_URL;
  const masterKey  = process.env.LITELLM_MASTER_KEY;
  if (gatewayUrl) {
    const messages = model.startsWith("claude")
      ? [{ role: "user", content: prompt }]
      : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }];

    const res = await fetch(`${gatewayUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(masterKey ? { Authorization: `Bearer ${masterKey}` } : {}),
      },
      body: JSON.stringify({ model, messages, max_tokens: maxOutputTokens, temperature }),
    });
    if (!res.ok) throw new Error(`LiteLLM error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }

  // ── Anthropic ───────────────────────────────────────────────────────────────
  if ((model === "claude-haiku-3-5" || model === "claude-sonnet-4-5") && process.env.ANTHROPIC_API_KEY) {
    const apiModel = model === "claude-haiku-3-5" ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-5";
    const body: Record<string, unknown> = {
      model: apiModel,
      max_tokens: maxOutputTokens,
      messages: [{ role: "user", content: prompt }],
    };
    if (systemPrompt) body.system = systemPrompt;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.content?.[0]?.text ?? "";
  }

  // ── Google Gemini ───────────────────────────────────────────────────────────
  if (model === "gemini-flash-2.0" && process.env.GOOGLE_AI_API_KEY) {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { maxOutputTokens, temperature },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  // ── GPT Image 1 ─────────────────────────────────────────────────────────────
  if (model === "gpt-image-1" && process.env.OPENAI_API_KEY) {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n${prompt}` : prompt;
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "gpt-image-1", prompt: fullPrompt, n: 1, size: "1024x1024", quality: "low" }),
    });
    if (!res.ok) throw new Error(`Image generation error ${res.status}: ${await res.text()}`);
    const data = await res.json() as { data?: { b64_json?: string }[] };
    const b64 = data?.data?.[0]?.b64_json ?? "";
    return b64 ? `data:image/png;base64,${b64}` : "";
  }

  // ── OpenAI ──────────────────────────────────────────────────────────────────
  if ((model === "gpt-4o-mini" || model === "gpt-4o") && process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: maxOutputTokens,
        temperature,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }

  throw new Error(`No provider configured for model: ${model}`);
}

export async function POST(req: NextRequest) {
  try {
    // ── STEP 1 — Parse body ──────────────────────────────────────────────────
    const body = await req.json() as { toolSlug?: string; inputs?: Record<string, string> };
    const { toolSlug, inputs = {} } = body;

    if (!toolSlug) {
      return ApiResponse.badRequest("toolSlug is required");
    }

    // ── STEP 2 — Fetch tool from DB ──────────────────────────────────────────
    await connectDB();
    const toolRaw = await Tool.findOne({ slug: toolSlug })
      .select('slug name type kitSlug systemPrompt promptTemplate formFields outputType aiModel aiProvider maxOutputTokens temperature isActive')
      .lean();
    if (!toolRaw) {
      return ApiResponse.notFound("Tool");
    }

    const tool = toolRaw as unknown as ToolDoc & {
      creditCost?: number;
      isActive?: boolean;
    };

    if ((tool as { type?: string }).type === "client-side") {
      return NextResponse.json(
        { error: "Client-side tools cannot use this endpoint" },
        { status: 400 }
      );
    }

    // ── STEP 3 — Auth ────────────────────────────────────────────────────────
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.response;
    const { userId } = authResult;

    const userDoc = await User.findById(userId)
      .select("purchasedCredits subscriptionCredits rolloverCredits plan isDeleted")
      .lean();
    if (!userDoc || userDoc.isDeleted) {
      return ApiResponse.forbidden();
    }

    // ── STEP 4 — Credit cost (from ToolConfig) ────────────────────────────────
    // Import ToolConfig for credit cost
    const { ToolConfig } = await import("@toolhub/db");
    const config = await ToolConfig.findOne({ toolSlug }).lean();
    const creditCost = config?.creditCost ?? 0;

    if (config && !config.isActive) {
      return ApiResponse.forbidden();
    }

    // ── STEP 5 — Credit check ─────────────────────────────────────────────────
    const userCredits: number =
      ((userDoc as { purchasedCredits?: number }).purchasedCredits ?? 0) +
      ((userDoc as { subscriptionCredits?: number }).subscriptionCredits ?? 0) +
      ((userDoc as { rolloverCredits?: number }).rolloverCredits ?? 0);
    if (userCredits < creditCost) {
      return ApiResponse.error("insufficient_credits", 402);
    }

    // ── STEP 6 — Abuse check ──────────────────────────────────────────────────
    const planSlug = (userDoc as { plan?: string }).plan ?? "free";
    const abuse = await checkAbuseLimit({ userId, toolSlug, planSlug });
    if (!abuse.allowed) {
      return NextResponse.json(
        { error: abuse.reason, retryAfter: abuse.retryAfter },
        { status: 429 }
      ); // retryAfter extra field — can't use ApiResponse.tooManyRequests here
    }

    // ── STEP 7 — Validate required fields ────────────────────────────────────
    const sanitizedInputs = sanitizeInputsObject(inputs);

    const formFields: Array<{ key: string; label: string; required?: boolean }> =
      (tool as unknown as { formFields?: Array<{ key: string; label: string; required?: boolean }> }).formFields ?? [];

    for (const field of formFields) {
      if (field.required && (!sanitizedInputs[field.key] || sanitizedInputs[field.key].trim() === "")) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }

    // ── STEP 8 — Build prompt ─────────────────────────────────────────────────
    const promptTemplate: string = (tool as unknown as { promptTemplate?: string }).promptTemplate ?? "";

    // Only substitute keys that are actually defined in the template — attacker-supplied
    // extra keys are ignored even if they match internal placeholder names.
    const templateKeys = new Set(
      [...promptTemplate.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
    );
    let prompt = promptTemplate;
    for (const key of templateKeys) {
      const value = sanitizedInputs[key] ?? "";
      prompt = prompt.replaceAll(`{{${key}}}`, value);
    }
    // Remove any remaining unmatched {{placeholders}}
    prompt = prompt.replace(/\{\{[^}]+\}\}/g, "");

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Prompt template is empty" }, { status: 400 });
    }

    // ── STEP 9 — Per-user concurrent request lock ─────────────────────────────
    const lockKey = `tool:lock:${userId}`;
    const redis = getRedis();
    const locked = await redis.set(lockKey, "1", { nx: true, ex: 10 });
    if (!locked) {
      return ApiResponse.tooManyRequests();
    }
    try {
      // ── STEP 10 — Call AI model ────────────────────────────────────────────
      const aiOutput = await callModel(tool as ToolDoc, prompt);

      if (!aiOutput || aiOutput.trim() === "") {
        throw new Error("Empty AI response");
      }

      // ── STEP 11 — Apply watermark ──────────────────────────────────────────
      const userPlan = await getUserPlan(userId);
      const output = applyWatermark(aiOutput, userPlan, toolSlug);

      // ── STEP 12 — Deduct credits (atomic tx, type: "use") ────────────────
      const { newBalance } = await CreditService.deductCredits(
        userId,
        creditCost,
        toolSlug
      );

      // ── STEP 12b — Save output history (non-blocking) ─────────────────────
      try {
        await ToolOutput.create({
          userId,
          toolSlug,
          inputSnapshot: sanitizedInputs,
          outputText: output,
          creditsUsed: creditCost,
        });
      } catch (histErr) {
        console.error("[tool-runner] ToolOutput save failed:", histErr);
      }

      // Invalidate balance cache
      await invalidateBalance(userId);

      // ── STEP 13 — Low credit alert (fire-and-forget) ───────────────────────
      checkAndSendCreditAlert(userId, newBalance, userPlan).catch(console.error);

      // ── STEP 14 — Return ───────────────────────────────────────────────────
      return NextResponse.json({ success: true, output });
    } finally {
      await redis.del(lockKey);
    }

  } catch (err) {
    console.error("[tool-runner]", err);
    return ApiResponse.error("AI generation failed. Please try again.");
  }
}
