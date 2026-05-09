export const linkedinBioConfig = {
  slug: "linkedin-bio",
  name: "LinkedIn Bio Generator",
  description: "Generate 3 professional LinkedIn bio variants — concise, storytelling, and achievement-focused.",
  creditCost: 3,
  kits: ["creator", "marketing", "hr"],
  isAI: true,
  model: "gpt-4o-mini",
  provider: "openai",
  maxTokens: 1200,
} as const;
