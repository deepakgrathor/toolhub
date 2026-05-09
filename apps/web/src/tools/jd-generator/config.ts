export const jdGeneratorConfig = {
  slug: "jd-generator",
  name: "JD Generator",
  description: "Generate professional job descriptions with responsibilities, requirements, and benefits in seconds.",
  creditCost: 3,
  kits: ["hr"],
  isAI: true,
  model: "gpt-4o-mini",
  provider: "openai",
  maxTokens: 2000,
} as const;
