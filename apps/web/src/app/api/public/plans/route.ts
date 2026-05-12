import { NextResponse } from "next/server";
import { connectDB, CreditPack } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

const CACHE_KEY = "public:plans";
const CACHE_TTL = 600; // 10 min

export async function GET() {
  try {
    const redis = getRedis();
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ plans: JSON.parse(cached as string) });
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  try {
    await connectDB();
    const plans = await CreditPack.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select("name credits priceInr isFeatured sortOrder")
      .lean();

    try {
      const redis = getRedis();
      await redis.set(CACHE_KEY, JSON.stringify(plans), { ex: CACHE_TTL });
    } catch {
      // silent
    }

    return NextResponse.json({ plans });
  } catch (err) {
    return NextResponse.json({ plans: [], error: "DB unavailable" }, { status: 200 });
  }
}
