// Scored recommendation engine for onboarding

export interface RecommendationInput {
  professions: string[];
  teamSize?: string;
  challenge?: string;
}

// ── Challenge tag mapping ─────────────────────────────────────────────────────

const CHALLENGE_TAGS: Record<string, string> = {
  time:       "time_saving",
  quality:    "quality",
  cost:       "cost",
  compliance: "compliance",
};

// ── Synchronous version (client-safe, uses cached result in memory) ───────────
// Used by the onboarding client component and as fallback.

interface ToolMeta {
  kit: string;
  tags: string[];
  free: boolean;
}

const TOOL_META: Record<string, ToolMeta> = {
  "blog-generator":      { kit: "creator",   tags: ["time_saving", "content", "creator"],                 free: false },
  "yt-script":           { kit: "creator",   tags: ["time_saving", "content", "creator"],                 free: false },
  "thumbnail-ai":        { kit: "creator",   tags: ["quality", "content", "creator"],                     free: false },
  "title-generator":     { kit: "creator",   tags: ["time_saving", "content", "creator"],                 free: false },
  "hook-writer":         { kit: "creator",   tags: ["time_saving", "content", "creator", "marketing"],    free: false },
  "caption-generator":   { kit: "creator",   tags: ["time_saving", "content", "creator", "marketing"],    free: false },
  "gst-invoice":         { kit: "sme",       tags: ["compliance", "cost", "sme"],                         free: true  },
  "expense-tracker":     { kit: "sme",       tags: ["cost", "sme", "time_saving"],                        free: true  },
  "quotation-generator": { kit: "sme",       tags: ["time_saving", "cost", "sme"],                        free: false },
  "website-generator":   { kit: "sme",       tags: ["quality", "sme"],                                    free: false },
  "qr-generator":        { kit: "sme",       tags: ["time_saving", "sme"],                                free: true  },
  "whatsapp-bulk":       { kit: "sme",       tags: ["time_saving", "sme", "marketing"],                   free: false },
  "salary-slip":         { kit: "hr",        tags: ["compliance", "hr", "time_saving"],                   free: true  },
  "resume-screener":     { kit: "hr",        tags: ["quality", "hr", "team"],                             free: false },
  "jd-generator":        { kit: "hr",        tags: ["time_saving", "hr"],                                 free: false },
  "offer-letter":        { kit: "hr",        tags: ["time_saving", "hr", "compliance"],                   free: false },
  "appraisal-draft":     { kit: "hr",        tags: ["quality", "hr", "time_saving"],                      free: false },
  "policy-generator":    { kit: "hr",        tags: ["compliance", "hr"],                                  free: false },
  "gst-calculator":      { kit: "legal",     tags: ["compliance", "cost", "legal", "sme"],                free: true  },
  "tds-sheet":           { kit: "legal",     tags: ["compliance", "cost", "legal"],                       free: true  },
  "legal-notice":        { kit: "legal",     tags: ["compliance", "legal"],                               free: false },
  "nda-generator":       { kit: "legal",     tags: ["compliance", "legal"],                               free: false },
  "legal-disclaimer":    { kit: "legal",     tags: ["compliance", "legal"],                               free: false },
  "ad-copy":             { kit: "marketing", tags: ["quality", "marketing", "time_saving"],               free: false },
  "email-subject":       { kit: "marketing", tags: ["time_saving", "marketing"],                          free: false },
  "linkedin-bio":        { kit: "marketing", tags: ["quality", "marketing"],                              free: false },
  "seo-auditor":         { kit: "marketing", tags: ["quality", "marketing"],                              free: false },
};

/** Synchronous scorer — safe for client components, uses in-memory TOOL_META. */
export function getRecommendedTools(input: RecommendationInput): string[] {
  const { professions, challenge } = input;

  const kitSet = new Set(professions);
  const challengeTag = challenge ? CHALLENGE_TAGS[challenge] : null;

  const scored = Object.entries(TOOL_META).map(([slug, meta]) => {
    let score = 0;
    if (kitSet.has(meta.kit)) score += 30;
    if (challengeTag && meta.tags.includes(challengeTag)) score += 20;
    if (meta.free) score += 15;
    return { slug, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(t => t.score > 0).slice(0, 8);
  if (top.length >= 6) return top.map(t => t.slug);
  return scored.slice(0, 6).map(t => t.slug);
}

// ── Async DB-backed version (server-side only) ────────────────────────────────

interface ScoredTool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  kitSlug: string;
  isFree: boolean;
  tags: string[];
  creditCost: number;
  score: number;
}

/** Async version that fetches from DB. For use in API routes only. */
export async function getRecommendedToolsFromDB(
  input: RecommendationInput
): Promise<ScoredTool[]> {
  const { connectDB, Tool, ToolConfig } = await import("@toolhub/db");
  await connectDB();

  const { professions, teamSize, challenge } = input;
  const kitSet = new Set(professions);
  const challengeTag = challenge ? CHALLENGE_TAGS[challenge] : null;

  const CHALLENGE_KEYWORD_MAP: Record<string, string[]> = {
    time_saving: ["automation", "quick", "fast", "bulk", "time_saving"],
    quality:     ["professional", "premium", "ai", "quality"],
    cost:        ["free", "affordable", "save", "cost"],
    compliance:  ["legal", "compliance", "gst", "tax"],
  };

  const [tools, configs] = await Promise.all([
    Tool.find({}).lean(),
    ToolConfig.find({}).lean(),
  ]);

  const configMap = new Map(
    (configs as Array<{ toolSlug: string; creditCost?: number; isActive?: boolean; isVisible?: boolean }>)
      .map(c => [c.toolSlug, c])
  );

  type ToolLean = {
    slug: string;
    name: string;
    description: string;
    icon: string;
    kitSlug?: string;
    isFree?: boolean;
    tags?: string[];
  };

  const scored = (tools as unknown as ToolLean[]).map(tool => {
    const config = configMap.get(tool.slug);
    if (config?.isActive === false || config?.isVisible === false) return null;

    let score = 0;
    const toolKit = tool.kitSlug ?? "";
    const toolTags: string[] = tool.tags ?? [];

    if (kitSet.has(toolKit)) score += 30;

    if (challengeTag) {
      const keywords = CHALLENGE_KEYWORD_MAP[challengeTag] ?? [];
      if (toolTags.some(tag => keywords.includes(tag))) score += 20;
    }

    if (tool.isFree || (config?.creditCost ?? 0) === 0) score += 15;

    if ((teamSize === "2-10" || teamSize === "11-50") && toolTags.includes("team")) {
      score += 10;
    }

    return {
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      icon: tool.icon,
      kitSlug: toolKit,
      isFree: tool.isFree ?? false,
      tags: toolTags,
      creditCost: config?.creditCost ?? 0,
      score,
    };
  }).filter((t): t is ScoredTool => t !== null && t.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8);
}

// ── Kit name builder ──────────────────────────────────────────────────────────

const PROFESSION_LABELS: Record<string, string> = {
  creator:   "Creator",
  sme:       "Business",
  hr:        "HR",
  legal:     "Legal",
  marketing: "Marketing",
  other:     "AI",
};

/** Sync version — uses hardcoded labels. */
export function buildKitName(firstName: string, professions: string[]): string {
  if (professions.length === 0) return `${firstName} AI Workspace`;
  if (professions.length === 1) {
    return `${firstName} ${PROFESSION_LABELS[professions[0]] ?? "AI"} Pro Kit`;
  }
  if (professions.length === 2) {
    const a = PROFESSION_LABELS[professions[0]] ?? "";
    const b = PROFESSION_LABELS[professions[1]] ?? "";
    return `${firstName} ${a} & ${b} Kit`;
  }
  return `${firstName} All-In-One Kit`;
}

/** Async version — fetches kit names from DB for accuracy. */
export async function buildKitNameFromDB(
  firstName: string,
  professions: string[]
): Promise<string> {
  if (professions.length === 0) return `${firstName} AI Workspace`;

  try {
    const { connectDB, Kit } = await import("@toolhub/db");
    await connectDB();

    type KitLean = { slug: string; name: string };
    const kits = await Kit.find({ slug: { $in: professions } }).select("slug name").lean() as unknown as KitLean[];
    const kitMap = new Map(kits.map(k => [k.slug, k.name.replace(" Kit", "").replace(" Pro", "")]));

    const labels = professions.map(p => kitMap.get(p) ?? PROFESSION_LABELS[p] ?? p);

    if (labels.length === 1) return `${firstName} ${labels[0]} Pro Kit`;
    if (labels.length === 2) return `${firstName} ${labels[0]} & ${labels[1]} Kit`;
    return `${firstName} All-In-One Kit`;
  } catch {
    return buildKitName(firstName, professions);
  }
}
