import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/PricingPage";
import type { Plan, CreditPackData, RolloverConfig } from "@/components/pricing/PricingPage";

export const metadata: Metadata = {
  title: "Pricing — ToolHub | Simple AI Tool Plans",
  description:
    "Start free with all non-AI tools. Upgrade to unlock AI credits for blog writing, invoices, HR docs, legal notices, and more. No hidden fees.",
};

export const dynamic = "force-dynamic";

async function fetchPlans(): Promise<Plan[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/public/plans`, { cache: "no-store" });
    const data = await res.json();
    return data.plans ?? [];
  } catch {
    return [];
  }
}

async function fetchPacks(): Promise<CreditPackData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/public/credit-packs`, { cache: "no-store" });
    const data = await res.json();
    return data.packs ?? [];
  } catch {
    return [];
  }
}

async function fetchRollover(): Promise<RolloverConfig> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/public/site-config/rollover`, { cache: "no-store" });
    return await res.json();
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
