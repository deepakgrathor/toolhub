export const captionGeneratorConfig = {
  slug: "caption-generator",
  name: "Caption Generator",
  description: "Generate engaging social media captions with hashtags for Instagram, LinkedIn, Twitter, and more.",
  creditCost: 0,
  kits: ["creator", "marketing"],
  isAI: true,
  model: "gpt-4o-mini",
  provider: "openai",
  maxTokens: 800,
} as const;
