// ── Credit Defaults ───────────────────────────────────────────────────────────
// These are FALLBACK values only — real values always come from DB/Redis

export const DEFAULT_CREDIT_COST = 5;
export const FREE_CREDITS_ON_SIGNUP = 10;

// ── Cache TTLs (seconds) ──────────────────────────────────────────────────────

export const TOOL_CONFIG_TTL = 60 * 5;   // 5 min
export const PRICING_TTL = 60 * 10;      // 10 min
export const SITE_CONFIG_TTL = 60 * 5;   // 5 min

// ── AI Models ─────────────────────────────────────────────────────────────────

export const AI_MODELS = {
  GPT_4O_MINI: "gpt-4o-mini",
  GPT_4O: "gpt-4o",
  CLAUDE_HAIKU: "claude-haiku-3-5",
  CLAUDE_SONNET: "claude-sonnet-4-5",
  GEMINI_FLASH: "gemini-flash-2.0",
  GEMINI_PRO: "gemini-pro",
  DALLE_3: "dall-e-3",
} as const;

// ── Routes ────────────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  TOOLS: "/tools",
  PRICING: "/pricing",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  ADMIN_TOOLS: "/admin/tools",
  ADMIN_PRICING: "/admin/pricing",
  ADMIN_USERS: "/admin/users",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

// ── Tool Kits ─────────────────────────────────────────────────────────────────

export const KITS = {
  CREATOR: "creator",
  SME: "sme",
  HR: "hr",
  CA_LEGAL: "ca-legal",
  MARKETING: "marketing",
} as const;

export type KitKey = typeof KITS[keyof typeof KITS];
