export const blogGeneratorConfig = {
  slug: "blog-generator",
  name: "Blog Generator",
  description: "Generate SEO-optimised blog posts tailored for Indian audiences in seconds.",
  creditCost: 3,
  kits: ["creator", "marketing"],
  isAI: true,
  model: "gpt-4o-mini",
  provider: "openai",
  maxTokens: 2000,
} as const;
