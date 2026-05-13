import { NextResponse } from "next/server";
import { connectDB, Plan } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

const CACHE_KEY = "plans:public";
const CACHE_TTL = 600; // 10 min

export async function GET() {
  try {
    const redis = getRedis();
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached as string) as unknown[];
      if (parsed.length > 0) {
        return NextResponse.json({ plans: parsed });
      }
      // Empty cached array means seed hadn't run yet — fall through to DB
      await redis.del(CACHE_KEY);
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  try {
    await connectDB();
    const plans = await Plan.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // Compute yearly savings per plan (both prices are monthly equivalents)
    const plansWithSavings = plans.map((plan) => {
      const yearlySavings =
        (plan.pricing.monthly.basePrice - plan.pricing.yearly.basePrice) * 12;
      return { ...plan, yearlySavings };
    });

    try {
      const redis = getRedis();
      await redis.set(CACHE_KEY, JSON.stringify(plansWithSavings), {
        ex: CACHE_TTL,
      });
    } catch {
      // silent
    }

    return NextResponse.json({ plans: plansWithSavings });
  } catch {
    return NextResponse.json(
      { plans: [], error: "DB unavailable" },
      { status: 200 }
    );
  }
}
