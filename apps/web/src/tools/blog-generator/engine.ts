import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import type { BlogGeneratorInput } from "./schema";

const LENGTH_WORDS = { short: 500, medium: 1000, long: 1500 } as const;

const SECTIONS_COUNT = { short: 3, medium: 4, long: 6 } as const;

function buildPrompt(input: BlogGeneratorInput): string {
  const wordTarget = LENGTH_WORDS[input.length];
  const sectionCount = SECTIONS_COUNT[input.length];
  const wordsPerSection = Math.floor((wordTarget * 0.7) / sectionCount);

  return `You are an expert blog writer for Indian audiences. Write a structured blog post.

Topic: ${input.topic}
Tone: ${input.tone}
Target audience: ${input.targetAudience || "general"}
Keywords to include naturally: ${input.keywords || "none"}
Sections: ${sectionCount} (each section content ~${wordsPerSection} words)

Rules:
- Each section "content" field: plain text only, no bullet points, no newlines inside strings
- metaDescription: max 155 characters
- cta: one short sentence
- All string values must be valid JSON (escape any quotes inside strings)

Return ONLY this JSON, no markdown, no explanation:
{"title":"...","metaDescription":"...","sections":[{"heading":"...","content":"..."}],"conclusion":"...","cta":"...","wordCount":${wordTarget}}`;
}

const MAX_TOKENS = 4096;

async function callAI(prompt: string): Promise<string> {
  // ── Anthropic ─────────────────────────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    if (!text) throw new Error("Empty Anthropic response");
    return text;
  }

  // ── OpenAI ────────────────────────────────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty OpenAI response");
    return text;
  }

  // ── Google Gemini ─────────────────────────────────────────────────────────
  if (process.env.GOOGLE_AI_API_KEY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: MAX_TOKENS },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Empty Gemini response");
    return text;
  }

  throw new Error(
    "No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY in your .env"
  );
}

function repairJson(raw: string): string {
  // Strip markdown fences
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  // If the string was truncated mid-JSON, close open structures so JSON.parse
  // has a chance of recovering some content.
  const opens = (s.match(/\[/g) ?? []).length - (s.match(/\]/g) ?? []).length;
  const braces = (s.match(/\{/g) ?? []).length - (s.match(/\}/g) ?? []).length;

  if (opens > 0 || braces > 0) {
    // Drop the last incomplete token (usually a half-written string or number)
    s = s.replace(/,?\s*"[^"]*$/, "").replace(/,?\s*\d+$/, "");
    s += "]".repeat(Math.max(0, opens));
    s += "}".repeat(Math.max(0, braces));
  }

  return s;
}

function extractJson(raw: string): Record<string, unknown> {
  const candidates = [
    raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim(),
    repairJson(raw),
  ];

  for (const c of candidates) {
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {
      // try next candidate
    }
  }

  // Last resort: grab the widest {...} block
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fall through */ }
    try { return JSON.parse(repairJson(match[0])); } catch { /* fall through */ }
  }

  throw new Error("Could not parse JSON from AI response");
}

export async function execute(
  input: BlogGeneratorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  // Load credit cost from DB — never hardcode
  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 3;

  const hasBalance = await CreditService.checkBalance(context.userId, creditCost);
  if (!hasBalance) {
    const balance = await CreditService.getBalance(context.userId);
    throw new InsufficientCreditsError(balance, creditCost);
  }

  const prompt = buildPrompt(input);
  const raw = await callAI(prompt);

  const parsed = extractJson(raw);

  // Deduct ONLY after successful generation
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

  return {
    output: JSON.stringify(parsed),
    structured: parsed,
    creditsUsed: creditCost,
    newBalance,
  };
}
