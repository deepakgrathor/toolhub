export const policyGeneratorConfig = {
  slug: "policy-generator",
  name: "Policy Generator",
  description: "Generate HR policy documents (leave, remote work, etc.) tailored to your org.",
  creditCost: 3,
  kits: ["hr"],
  isAI: true,
  model: "claude-haiku-3-5",
  provider: "anthropic",
} as const;
