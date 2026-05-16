import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, CreditTransaction } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import mongoose from "mongoose";

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

  // Only plan info is cached — balance always comes from Zustand on the client
  const cacheKey = `sidebar:${session.user.id}`;

  try {
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached as string));
  } catch {
    // silent
  }

  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);

  const [user, totalAgg] = await Promise.all([
    User.findById(uid).select("plan").lean(),
    // Sum all credits ever received (purchases + plan grants + referrals + bonuses)
    CreditTransaction.aggregate([
      { $match: { userId: uid, amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const planSlug = user.plan ?? "free";
  // totalReceived = all credits ever added to this account (packs + plan + referrals)
  const totalReceived: number = totalAgg[0]?.total ?? 0;

  const data = {
    planSlug,
    planName: PLAN_NAMES[planSlug] ?? "Free",
    totalReceived,
  };

  try {
    const redis = getRedis();
    await redis.set(cacheKey, JSON.stringify(data), { ex: 300 }); // 5 min TTL (plan changes rarely)
  } catch {
    // silent
  }

  return NextResponse.json(data);
}
