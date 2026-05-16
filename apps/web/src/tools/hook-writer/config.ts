export const hookWriterConfig = {
  slug: "hook-writer",
  name: "Hook Writer",
  description: "Generate viral opening hooks for your social media posts, reels, and videos in seconds.",
  creditCost: 1,
  kits: ["creator", "marketing"],
  isAI: true,
  model: "gpt-4o-mini",
  provider: "openai",
  maxTokens: 800,
} as const;
