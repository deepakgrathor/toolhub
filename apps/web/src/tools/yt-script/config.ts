export const ytScriptConfig = {
  slug: "yt-script",
  name: "YT Script Writer",
  description: "Generate complete YouTube video scripts with hooks, segments, and CTAs tailored for Indian creators.",
  creditCost: 4,
  kits: ["creator"],
  isAI: true,
  model: "gpt-4o-mini",
  provider: "openai",
  maxTokens: 4096,
} as const;
