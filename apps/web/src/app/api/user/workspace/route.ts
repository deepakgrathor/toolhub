import { NextResponse } from "next/server";
import { auth } from "@/auth";
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

// profession → kit id mapping
const PROFESSION_KIT: Record<string, string> = {
  creator:  "creator",
  sme:      "sme",
  hr:       "hr",
  legal:    "ca-legal",
  marketer: "marketing",
  other:    "creator",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
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
    .select("profession kitName selectedTools")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profession = (user as { profession?: string }).profession ?? "creator";
  const kitName = (user as { kitName?: string }).kitName ?? "My Workspace";
  const selectedTools: string[] = (user as { selectedTools?: string[] }).selectedTools ?? [];

  // Find kit tools for user's profession
  const kitId = PROFESSION_KIT[profession] ?? "creator";
  const kit = SIDEBAR_KITS.find((k) => k.id === kitId);
  const kitTools = kit
    ? kit.tools.map((t) => ({ slug: t.slug, name: t.name }))
    : [];

  // Added tools (not already in kit)
  const kitSlugs = new Set(kitTools.map((t) => t.slug));
  const addedTools = selectedTools
    .filter((slug) => !kitSlugs.has(slug))
    .map((slug) => ({ slug, name: TOOL_NAMES[slug] ?? slug }));

  const result = { kitName, profession, kitTools, addedTools };

  try {
    const redis = getRedis();
    await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL });
  } catch {
    // silent
  }

  return NextResponse.json(result);
}
