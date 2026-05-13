import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/PricingPage";
import type { Plan, CreditPackData, RolloverConfig } from "@/components/pricing/PricingPage";
import { connectDB, Plan as PlanModel, CreditPack, SiteConfig } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

export const metadata: Metadata = {
  title: "Pricing — ToolHub | Simple AI Tool Plans",
  description:
    "Start free with all non-AI tools. Upgrade to unlock AI credits for blog writing, invoices, HR docs, legal notices, and more. No hidden fees.",
};

export const dynamic = "force-dynamic";

async function fetchPlans(): Promise<Plan[]> {
  try {
    // Try Redis cache first
    try {
      const redis = getRedis();
      const cached = await redis.get("plans:public");
      if (cached) {
        const parsed = JSON.parse(cached as string) as Plan[];
        if (parsed.length > 0) return parsed;
        await redis.del("plans:public");
      }
    } catch {
      // Redis unavailable
    }

    await connectDB();
    const plans = await PlanModel.find({ isActive: true }).sort({ order: 1 }).lean();

    const plansWithSavings = plans.map((plan) => {
      const yearlySavings =
        (plan.pricing.monthly.basePrice - plan.pricing.yearly.basePrice) * 12;
      return { ...plan, yearlySavings };
    });

    try {
      const redis = getRedis();
      await redis.set("plans:public", JSON.stringify(plansWithSavings), { ex: 600 });
    } catch {
      // silent
    }

    return plansWithSavings as unknown as Plan[];
  } catch {
    return [];
  }
}

async function fetchPacks(): Promise<CreditPackData[]> {
  try {
    try {
      const redis = getRedis();
      const cached = await redis.get("credit-packs:public");
      if (cached) return JSON.parse(cached as string) as CreditPackData[];
    } catch {
      // Redis unavailable
    }

    await connectDB();
    const packs = await CreditPack.find({ isActive: true }).sort({ order: 1 }).lean();

    try {
      const redis = getRedis();
      await redis.set("credit-packs:public", JSON.stringify(packs), { ex: 600 });
    } catch {
      // silent
    }

    return packs as unknown as CreditPackData[];
  } catch {
    return [];
  }
}

async function fetchRollover(): Promise<RolloverConfig> {
  try {
    try {
      const redis = getRedis();
      const cached = await redis.get("site-config:rollover");
      if (cached) return JSON.parse(cached as string) as RolloverConfig;
    } catch {
      // Redis unavailable
    }

    await connectDB();
    const [enabledDoc, daysDoc] = await Promise.all([
      SiteConfig.findOne({ key: "credit_rollover_enabled" }).lean(),
      SiteConfig.findOne({ key: "credit_rollover_days" }).lean(),
    ]);

    const result: RolloverConfig = {
      enabled: (enabledDoc?.value as boolean) ?? false,
      maxDays: (daysDoc?.value as number) ?? 30,
    };

    try {
      const redis = getRedis();
      await redis.set("site-config:rollover", JSON.stringify(result), { ex: 300 });
    } catch {
      // silent
    }

    return result;
  } catch {
    return { enabled: false, maxDays: 30 };
  }
}

export default async function MarketingPricingPage() {
  const [plans, packs, rollover] = await Promise.all([
    fetchPlans(),
    fetchPacks(),
    fetchRollover(),
  ]);

  return <PricingPage plans={plans} packs={packs} rollover={rollover} />;
}
