export const appraisalDraftConfig = {
  slug: "appraisal-draft",
  name: "Appraisal Draft",
  description: "AI drafts fair, structured performance appraisal documents for employees.",
  creditCost: 3,
  kits: ["hr"],
  isAI: true,
  model: "claude-haiku-3-5",
  provider: "anthropic",
} as const;
