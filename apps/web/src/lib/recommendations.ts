// Scored recommendation engine for onboarding

interface ToolMeta {
  kit: string; // matches SIDEBAR_KITS id
  tags: string[];
  free: boolean;
}

const TOOL_META: Record<string, ToolMeta> = {
  "blog-generator":      { kit: "creator",   tags: ["time_saving", "content", "creator"],                  free: false },
  "yt-script":           { kit: "creator",   tags: ["time_saving", "content", "creator"],                  free: false },
  "thumbnail-ai":        { kit: "creator",   tags: ["quality", "content", "creator"],                      free: false },
  "title-generator":     { kit: "creator",   tags: ["time_saving", "content", "creator"],                  free: false },
  "hook-writer":         { kit: "creator",   tags: ["time_saving", "content", "creator", "marketing"],     free: false },
  "caption-generator":   { kit: "creator",   tags: ["time_saving", "content", "creator", "marketing"],     free: false },
  "gst-invoice":         { kit: "sme",       tags: ["compliance", "cost", "sme"],                          free: true  },
  "expense-tracker":     { kit: "sme",       tags: ["cost", "sme", "time_saving"],                         free: true  },
  "quotation-generator": { kit: "sme",       tags: ["time_saving", "cost", "sme"],                         free: false },
  "website-generator":   { kit: "sme",       tags: ["quality", "sme"],                                     free: false },
  "qr-generator":        { kit: "sme",       tags: ["time_saving", "sme"],                                 free: true  },
  "whatsapp-bulk":       { kit: "sme",       tags: ["time_saving", "sme", "marketing"],                    free: false },
  "salary-slip":         { kit: "hr",        tags: ["compliance", "hr", "time_saving"],                    free: true  },
  "resume-screener":     { kit: "hr",        tags: ["quality", "hr", "team"],                              free: false },
  "jd-generator":        { kit: "hr",        tags: ["time_saving", "hr"],                                  free: false },
  "offer-letter":        { kit: "hr",        tags: ["time_saving", "hr", "compliance"],                    free: false },
  "appraisal-draft":     { kit: "hr",        tags: ["quality", "hr", "time_saving"],                       free: false },
  "policy-generator":    { kit: "hr",        tags: ["compliance", "hr"],                                   free: false },
  "gst-calculator":      { kit: "ca-legal",  tags: ["compliance", "cost", "legal", "sme"],                 free: true  },
  "tds-sheet":           { kit: "ca-legal",  tags: ["compliance", "cost", "legal"],                        free: true  },
  "legal-notice":        { kit: "ca-legal",  tags: ["compliance", "legal"],                                free: false },
  "nda-generator":       { kit: "ca-legal",  tags: ["compliance", "legal"],                                free: false },
  "legal-disclaimer":    { kit: "ca-legal",  tags: ["compliance", "legal"],                                free: false },
  "ad-copy":             { kit: "marketing", tags: ["quality", "marketing", "time_saving"],                free: false },
  "email-subject":       { kit: "marketing", tags: ["time_saving", "marketing"],                           free: false },
  "linkedin-bio":        { kit: "marketing", tags: ["quality", "marketing"],                               free: false },
  "seo-auditor":         { kit: "marketing", tags: ["quality", "marketing"],                               free: false },
};

// profession value → kit id
const PROFESSION_TO_KIT: Record<string, string> = {
  creator:  "creator",
  sme:      "sme",
  hr:       "hr",
  legal:    "ca-legal",
  marketer: "marketing",
  other:    "",
};

const CHALLENGE_TAGS: Record<string, string> = {
  time:       "time_saving",
  quality:    "quality",
  cost:       "cost",
  compliance: "compliance",
};

export interface RecommendationInput {
  professions: string[];
  teamSize?: string;
  challenge?: string;
}

export function getRecommendedTools(input: RecommendationInput): string[] {
  const { professions, challenge } = input;

  const kitSet = new Set(
    professions.map((p) => PROFESSION_TO_KIT[p]).filter(Boolean)
  );
  const challengeTag = challenge ? CHALLENGE_TAGS[challenge] : null;

  const scored = Object.entries(TOOL_META).map(([slug, meta]) => {
    let score = 0;
    if (kitSet.has(meta.kit)) score += 30;
    if (challengeTag && meta.tags.includes(challengeTag)) score += 20;
    if (meta.free) score += 15;
    return { slug, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.filter((t) => t.score > 0).slice(0, 8);
  if (top.length >= 6) return top.map((t) => t.slug);
  return scored.slice(0, 6).map((t) => t.slug);
}

const PROFESSION_LABELS: Record<string, string> = {
  creator:  "Creator",
  sme:      "Business",
  hr:       "HR",
  legal:    "Legal",
  marketer: "Marketing",
  other:    "AI",
};

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
