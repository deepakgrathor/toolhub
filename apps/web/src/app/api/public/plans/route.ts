import { NextResponse } from "next/server";
import { connectDB, Plan } from "@toolhub/db";
import { withCache } from "@/lib/with-cache";

export async function GET() {
  try {
    const plans = await withCache("plans:public", 600, async () => {
      await connectDB();
      const rawPlans = await Plan.find({ isActive: true })
        .sort({ order: 1 })
        .lean();

      return rawPlans.map((plan) => ({
        ...plan,
        yearlySavings:
          (plan.pricing.monthly.basePrice - plan.pricing.yearly.basePrice) * 12,
      }));
    });

    const response = NextResponse.json({ plans });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return response;
  } catch {
    return NextResponse.json(
      { plans: [], error: "DB unavailable" },
      { status: 200 }
    );
  }
}
