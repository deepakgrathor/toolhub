import type { Metadata } from "next";
import { connectDB, Plan } from "@toolhub/db";
import { PlansTable } from "@/components/admin/PlansTable";
import type { PlanRow } from "@/components/admin/PlansTable";

export const metadata: Metadata = { title: "Admin Plans — ToolHub" };
export const dynamic = "force-dynamic";

async function getPlans(): Promise<PlanRow[]> {
  try {
    await connectDB();
    const plans = await Plan.find().sort({ order: 1 }).lean();
    return plans.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      type: p.type,
      isActive: p.isActive,
      isPopular: p.isPopular,
      order: p.order,
      monthlyBase: p.pricing.monthly.basePrice,
      monthlyBaseCredits: p.pricing.monthly.baseCredits,
      yearlyBase: p.pricing.yearly.basePrice,
      yearlyBaseCredits: p.pricing.yearly.baseCredits,
      features: (p.features ?? []).map((f) => ({
        text: f.text,
        included: f.included,
        highlight: typeof f.highlight === "string" ? f.highlight : "",
      })),
    }));
  } catch {
    return [];
  }
}

export default async function AdminPlansPage() {
  const plans = await getPlans();
  return (
    <div className="p-6">
      <PlansTable initialPlans={plans} />
    </div>
  );
}
