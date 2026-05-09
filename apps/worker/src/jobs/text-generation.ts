import type { Job } from "bullmq";

interface TextGenPayload {
  model: string;
  messages: { role: string; content: string }[];
  maxTokens: number;
  userId: string;
  toolSlug: string;
}

export interface TextGenResult {
  content: string;
  tokensUsed: number;
}

export async function processTextGeneration(job: Job): Promise<TextGenResult> {
  const payload = job.data as TextGenPayload;

  const res = await fetch(
    `${process.env.LITELLM_GATEWAY_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LITELLM_MASTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        max_tokens: payload.maxTokens,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LiteLLM error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content as string,
    tokensUsed: (data.usage?.total_tokens as number) ?? 0,
  };
}
