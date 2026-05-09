export const ndaGeneratorConfig = {
  slug: "nda-generator",
  name: "NDA Generator",
  description: "Generate a complete Non-Disclosure Agreement tailored to your requirements.",
  creditCost: 12,
  kits: ["ca-legal"],
  isAI: true,
  model: "claude-sonnet-4-5",
  provider: "anthropic",
} as const;
