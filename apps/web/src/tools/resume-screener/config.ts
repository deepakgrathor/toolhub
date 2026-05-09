export const resumeScreenerConfig = {
  slug: "resume-screener",
  name: "Resume Screener",
  description: "AI screens resumes against your JD and ranks candidates with fit scores.",
  creditCost: 3,
  kits: ["hr"],
  isAI: true,
  model: "claude-haiku-3-5",
  provider: "anthropic",
} as const;
