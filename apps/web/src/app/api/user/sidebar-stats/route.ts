import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

const PLAN_CREDITS: Record<string, number> = {
  free: 10,
  lite: 200,
  pro: 700,
  business: 1500,
  enterprise: 9999,
};

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  lite: "Lite",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `sidebar:${session.user.id}`;

  try {
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached as string));
  } catch {
    // silent
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("credits plan").lean();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const planSlug = user.plan ?? "free";
  const currentCredits = user.credits ?? 0;
  // planCredits is the higher of the plan quota or current balance (bonuses can exceed plan quota)
  const planCredits = Math.max(PLAN_CREDITS[planSlug] ?? 10, currentCredits);
  const creditsUsed = Math.max(0, planCredits - currentCredits);

  const data = {
    planSlug,
    planName: PLAN_NAMES[planSlug] ?? "Free",
    currentCredits,
    planCredits,
    creditsUsed,
  };

  try {
    const redis = getRedis();
    await redis.set(cacheKey, JSON.stringify(data), { ex: 120 }); // 2 min TTL
  } catch {
    // silent
  }

  return NextResponse.json(data);
}
