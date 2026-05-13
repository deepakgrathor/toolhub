/**
 * Plan-level tool access control.
 * Defines which tools are blocked per plan and provides helper functions.
 */

type PlanSlug = "free" | "lite" | "pro" | "business" | "enterprise";

const PLAN_TOOL_ACCESS: Record<PlanSlug, { blocked: string[] }> = {
  free: {
    blocked: [
      "blog-generator",
      "yt-script",
      "thumbnail-ai",
      "jd-generator",
      "resume-screener",
      "appraisal-draft",
      "policy-generator",
      "offer-letter",
      "legal-notice",
      "nda-generator",
      "legal-disclaimer",
      "ad-copy",
      "linkedin-bio",
      "seo-auditor",
      "website-generator",
      "whatsapp-bulk",
    ],
  },
  lite: {
    blocked: [
      "website-generator",
      "legal-notice",
      "nda-generator",
      "thumbnail-ai",
      "seo-auditor",
    ],
  },
  pro: { blocked: [] },
  business: { blocked: [] },
  enterprise: { blocked: [] },
};

const REQUIRED_PLAN: Record<string, PlanSlug> = {
  "website-generator": "pro",
  "legal-notice": "pro",
  "nda-generator": "pro",
  "thumbnail-ai": "pro",
  "seo-auditor": "pro",
  "blog-generator": "lite",
  "yt-script": "lite",
  "jd-generator": "lite",
  "resume-screener": "lite",
  "appraisal-draft": "lite",
  "policy-generator": "lite",
  "legal-disclaimer": "lite",
  "ad-copy": "lite",
  "linkedin-bio": "lite",
  "whatsapp-bulk": "lite",
};

const PLAN_DISPLAY: Record<PlanSlug, string> = {
  free: "Free",
  lite: "Lite",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export function isPlanBlocked(_planSlug: string, _toolSlug: string): boolean {
  return false; // Credit-only access — no plan-based blocking
}

export function getUpgradeMessage(planSlug: string, toolSlug: string): string {
  const required = REQUIRED_PLAN[toolSlug];
  if (!required) return "This tool requires a paid plan. Upgrade to unlock.";
  const planName = PLAN_DISPLAY[required] ?? required.toUpperCase();
  const toolName = toolSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `${toolName} requires ${planName} plan. Upgrade to unlock.`;
}

export function getRequiredPlan(toolSlug: string): PlanSlug | null {
  return REQUIRED_PLAN[toolSlug] ?? null;
}
