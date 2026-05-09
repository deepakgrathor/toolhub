export const emailSubjectConfig = {
  slug: "email-subject",
  name: "Email Subject Line",
  description: "Generate high open-rate email subject lines for any campaign using AI.",
  creditCost: 1,
  kits: ["marketing"],
  isAI: true,
  model: "gemini-flash-2.0",
  provider: "google",
} as const;
