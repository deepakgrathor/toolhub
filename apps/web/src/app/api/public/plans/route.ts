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
      return NextResponse.json({ plans: JSON.parse(cached as string) });
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  try {
    await connectDB();
    const plans = await Plan.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // Compute yearly savings per plan
    const plansWithSavings = plans.map((plan) => {
      const monthlyCost = plan.pricing.monthly.basePrice * 12;
      const yearlyCost = plan.pricing.yearly.basePrice;
      const yearlySavings = monthlyCost - yearlyCost;
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
