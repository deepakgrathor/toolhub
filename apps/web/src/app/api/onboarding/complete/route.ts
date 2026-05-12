import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

const PROFESSION_TOOLS: Record<string, string[]> = {
  creator: [
    "blog-generator",
    "yt-script",
    "hook-writer",
    "caption-generator",
    "thumbnail-ai",
    "title-generator",
  ],
  sme: [
    "gst-invoice",
    "expense-tracker",
    "quotation-generator",
    "qr-generator",
    "website-generator",
    "gst-calculator",
  ],
  hr: [
    "jd-generator",
    "resume-screener",
    "appraisal-draft",
    "policy-generator",
    "offer-letter",
    "salary-slip",
  ],
  legal: [
    "legal-notice",
    "nda-generator",
    "legal-disclaimer",
    "gst-calculator",
    "tds-sheet",
    "whatsapp-bulk",
  ],
  marketer: [
    "ad-copy",
    "caption-generator",
    "email-subject",
    "linkedin-bio",
    "hook-writer",
    "seo-auditor",
  ],
  other: ["blog-generator", "yt-script", "gst-invoice", "jd-generator", "ad-copy", "qr-generator"],
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    profession: string;
    teamSize: string;
    challenge: string;
    kitName: string;
  };

  const { profession, teamSize, challenge, kitName } = body;

  if (!profession || !kitName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();

  const recommendedTools = PROFESSION_TOOLS[profession] ?? PROFESSION_TOOLS.other;

  await User.findByIdAndUpdate(session.user.id, {
    profession,
    kitName,
    onboardingCompleted: true,
    onboardingStep: 4,
    selectedTools: recommendedTools,
  });

  // Create or update BusinessProfile
  await BusinessProfile.findOneAndUpdate(
    { userId: session.user.id },
    {
      userId: session.user.id,
      teamSize: teamSize || null,
    },
    { upsert: true, new: true }
  );

  // Invalidate user cache
  try {
    const redis = getRedis();
    await redis.del(`SetuLix:user:${session.user.id}`);
  } catch {
    // silent
  }

  void challenge; // stored on user model if needed in future
  return NextResponse.json({ redirectTo: "/dashboard" });
}
