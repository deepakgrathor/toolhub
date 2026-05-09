/**
 * Streaming AI call utilities.
 * Each provider pipes server-sent events / chunked transfer to a callback.
 * Returns the full accumulated text when the stream finishes.
 */

const ANTHROPIC_MODEL_IDS: Record<string, string> = {
  "claude-haiku-3-5": "claude-haiku-4-5-20251001",
  "claude-sonnet-4-5": "claude-sonnet-4-5",
};

// ── SSE line parser ───────────────────────────────────────────────────────────

function parseSseLine(line: string): string | null {
  if (!line.startsWith("data:")) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;
  return payload;
}

// ── Provider streaming implementations ───────────────────────────────────────

async function streamAnthropic(
  prompt: string,
  model: string,
  onChunk: (text: string) => void
): Promise<string> {
  const apiModel = ANTHROPIC_MODEL_IDS[model] ?? model;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: apiModel,
      max_tokens: 4096,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Anthropic stream error ${res.status}: ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      const data = parseSseLine(line);
      if (!data) continue;
      try {
        const obj = JSON.parse(data);
        if (obj.type === "content_block_delta" && obj.delta?.type === "text_delta") {
          const chunk: string = obj.delta.text ?? "";
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        // malformed SSE line — skip
      }
    }
  }

  return full;
}

async function streamOpenAI(
  prompt: string,
  model: string,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`OpenAI stream error ${res.status}: ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      const data = parseSseLine(line);
      if (!data) continue;
      try {
        const obj = JSON.parse(data);
        const chunk: string = obj.choices?.[0]?.delta?.content ?? "";
        if (chunk) {
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        // skip
      }
    }
  }

  return full;
}

async function streamGemini(
  prompt: string,
  model: string,
  onChunk: (text: string) => void
): Promise<string> {
  const geminiModel = model === "gemini-flash-2.0" ? "gemini-2.0-flash" : model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${process.env.GOOGLE_AI_API_KEY}&alt=sse`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Gemini stream error ${res.status}: ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      const data = parseSseLine(line);
      if (!data) continue;
      try {
        const obj = JSON.parse(data);
        const chunk: string =
          obj.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (chunk) {
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        // skip
      }
    }
  }

  return full;
}

// ── LiteLLM gateway streaming ─────────────────────────────────────────────────

async function streamLiteLLM(
  prompt: string,
  model: string,
  onChunk: (text: string) => void
): Promise<string> {
  const gatewayUrl = process.env.LITELLM_GATEWAY_URL!;
  const masterKey = process.env.LITELLM_MASTER_KEY;

  const res = await fetch(`${gatewayUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(masterKey ? { Authorization: `Bearer ${masterKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`LiteLLM stream error ${res.status}: ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      const data = parseSseLine(line);
      if (!data) continue;
      try {
        const obj = JSON.parse(data);
        const chunk: string = obj.choices?.[0]?.delta?.content ?? "";
        if (chunk) {
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        // skip
      }
    }
  }

  return full;
}

// ── Public API ────────────────────────────────────────────────────────────────

const MODEL_PROVIDER: Record<string, string> = {
  "gpt-4o-mini": "openai",
  "gpt-4o": "openai",
  "claude-haiku-3-5": "anthropic",
  "claude-haiku-4-5-20251001": "anthropic",
  "claude-sonnet-4-5": "anthropic",
  "gemini-flash-2.0": "google",
  "gemini-pro": "google",
};

/**
 * Streams AI response, calling onChunk for every text delta.
 * Returns the fully accumulated text when done.
 */
export async function callAIStream(
  prompt: string,
  model: string,
  provider: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  // LiteLLM gateway takes priority
  if (process.env.LITELLM_GATEWAY_URL) {
    return streamLiteLLM(prompt, model, onChunk);
  }

  const resolvedProvider = provider || MODEL_PROVIDER[model] || "openai";

  if (resolvedProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return streamAnthropic(prompt, model, onChunk);
  }

  if (resolvedProvider === "google" && process.env.GOOGLE_AI_API_KEY) {
    return streamGemini(prompt, model, onChunk);
  }

  if (process.env.OPENAI_API_KEY) {
    return streamOpenAI(
      prompt,
      resolvedProvider === "openai" ? model : "gpt-4o-mini",
      onChunk
    );
  }

  throw new Error(
    "No AI provider configured. Set LITELLM_GATEWAY_URL, ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY."
  );
}
