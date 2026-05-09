// Shared AI call utility — used by all tool engines

const MODEL_PROVIDER: Record<string, string> = {
  "gpt-4o-mini": "openai",
  "gpt-4o": "openai",
  "claude-haiku-3-5": "anthropic",
  "claude-haiku-4-5-20251001": "anthropic",
  "claude-sonnet-4-5": "anthropic",
  "gemini-flash-2.0": "google",
  "gemini-pro": "google",
};

const ANTHROPIC_MODEL_IDS: Record<string, string> = {
  "claude-haiku-3-5": "claude-haiku-4-5-20251001",
  "claude-sonnet-4-5": "claude-sonnet-4-5",
};

const MAX_TOKENS = 4096;

export async function callAI(
  prompt: string,
  model: string,
  provider: string
): Promise<string> {
  const gatewayUrl = process.env.LITELLM_GATEWAY_URL;
  const masterKey = process.env.LITELLM_MASTER_KEY;
  if (gatewayUrl) {
    const res = await fetch(`${gatewayUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(masterKey ? { Authorization: `Bearer ${masterKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: MAX_TOKENS,
      }),
    });
    if (!res.ok) throw new Error(`LiteLLM error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty LiteLLM response");
    return text;
  }

  const resolvedProvider = provider || MODEL_PROVIDER[model] || "openai";

  if (resolvedProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const apiModel = ANTHROPIC_MODEL_IDS[model] ?? model;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: apiModel,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    if (!text) throw new Error("Empty Anthropic response");
    return text;
  }

  if (resolvedProvider === "google" && process.env.GOOGLE_AI_API_KEY) {
    const geminiModel = model === "gemini-flash-2.0" ? "gemini-2.0-flash" : model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: MAX_TOKENS },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Empty Gemini response");
    return text;
  }

  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedProvider === "openai" ? model : "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty OpenAI response");
    return text;
  }

  throw new Error(
    "No AI provider configured. Set LITELLM_GATEWAY_URL, ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY."
  );
}

export function repairJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const opens = (s.match(/\[/g) ?? []).length - (s.match(/\]/g) ?? []).length;
  const braces = (s.match(/\{/g) ?? []).length - (s.match(/\}/g) ?? []).length;
  if (opens > 0 || braces > 0) {
    s = s.replace(/,?\s*"[^"]*$/, "").replace(/,?\s*\d+$/, "");
    s += "]".repeat(Math.max(0, opens));
    s += "}".repeat(Math.max(0, braces));
  }
  return s;
}

export function extractJson(raw: string): Record<string, unknown> {
  const candidates = [
    raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim(),
    repairJson(raw),
  ];
  for (const c of candidates) {
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {
      // try next
    }
  }
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fall through */ }
    try { return JSON.parse(repairJson(match[0])); } catch { /* fall through */ }
  }
  throw new Error("Could not parse JSON from AI response");
}
