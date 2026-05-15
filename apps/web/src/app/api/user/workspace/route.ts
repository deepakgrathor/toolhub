import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB, User } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { SIDEBAR_KITS } from "@/lib/kit-config";

const CACHE_TTL = 300; // 5 min

const TOOL_NAMES: Record<string, string> = {
  "blog-generator": "Blog Generator", "yt-script": "YT Script Writer",
  "thumbnail-ai": "Thumbnail AI", "title-generator": "Title Generator",
  "hook-writer": "Hook Writer", "caption-generator": "Caption Generator",
  "gst-invoice": "GST Invoice", "expense-tracker": "Expense Tracker",
  "quotation-generator": "Quotation Generator", "website-generator": "Website Generator",
  "qr-generator": "QR Generator", "gst-calculator": "GST Calculator",
  "jd-generator": "JD Generator", "resume-screener": "Resume Screener",
  "appraisal-draft": "Appraisal Draft", "policy-generator": "Policy Generator",
  "offer-letter": "Offer Letter", "salary-slip": "Salary Slip",
  "legal-notice": "Legal Notice", "nda-generator": "NDA Generator",
  "legal-disclaimer": "Legal Disclaimer", "tds-sheet": "TDS Sheet",
  "whatsapp-bulk": "WhatsApp Bulk", "ad-copy": "Ad Copy",
  "email-subject": "Email Subject", "linkedin-bio": "LinkedIn Bio",
  "seo-auditor": "SEO Auditor",
};

// profession → kit id
const PROFESSION_KIT: Record<string, string> = {
  creator:  "creator",
  sme:      "sme",
  hr:       "hr",
  legal:    "ca-legal",
  marketer: "marketing",
  other:    "creator",
};

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.response;
  const { userId } = authResult;
  const cacheKey = `workspace:${userId}`;

  try {
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string));
    }
  } catch {
    // Redis unavailable
  }

  await connectDB();
  const user = await User.findById(userId)
    .select("profession professions kitName selectedTools")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const typedUser = user as {
    profession?: string;
    professions?: string[];
    kitName?: string;
    selectedTools?: string[];
  };

  // Prefer new professions array; fall back to legacy single profession
  const professions: string[] =
    Array.isArray(typedUser.professions) && typedUser.professions.length > 0
      ? typedUser.professions
      : typedUser.profession
      ? [typedUser.profession]
      : ["creator"];

  const kitName = typedUser.kitName ?? "My Workspace";
  const selectedTools: string[] = typedUser.selectedTools ?? [];

  // Collect kit tools for ALL selected professions (de-duped)
  const kitSlugsSeen = new Set<string>();
  const kitTools: { slug: string; name: string }[] = [];

  for (const prof of professions) {
    const kitId = PROFESSION_KIT[prof] ?? "creator";
    const kit = SIDEBAR_KITS.find((k) => k.id === kitId);
    if (!kit) continue;
    for (const t of kit.tools) {
      if (!kitSlugsSeen.has(t.slug)) {
        kitSlugsSeen.add(t.slug);
        kitTools.push({ slug: t.slug, name: t.name });
      }
    }
  }

  // Added tools = selectedTools not already in kit
  const addedTools = selectedTools
    .filter((slug) => !kitSlugsSeen.has(slug))
    .map((slug) => ({ slug, name: TOOL_NAMES[slug] ?? slug }));

  const result = { kitName, professions, kitTools, addedTools };

  try {
    const redis = getRedis();
    await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL });
  } catch {
    // silent
  }

  return NextResponse.json(result);
}
