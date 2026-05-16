export const legalNoticeConfig = {
  slug: "legal-notice",
  name: "Legal Notice Draft",
  description: "AI drafts legally sound notices for consumer, employment, or property matters.",
  creditCost: 8,
  kits: ["ca-legal"],
  isAI: true,
  model: "claude-sonnet-4-5",
  provider: "anthropic",
} as const;
