import type { Metadata } from "next";
import { connectDB, Plan, DEFAULT_LIMITS } from "@toolhub/db";
import { PlansTable } from "@/components/admin/PlansTable";
import type { PlanRow } from "@/components/admin/PlansTable";

export const metadata: Metadata = { title: "Admin Plans — SetuLix" };
export const dynamic = "force-dynamic";

async function getPlans(): Promise<PlanRow[]> {
  try {
    await connectDB();
    const plans = await Plan.find().sort({ order: 1 }).lean();
    return plans.map((p) => {
      const fallback = DEFAULT_LIMITS[p.slug] ?? DEFAULT_LIMITS["free"];
      const limits = p.limits ?? {};
      return {
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
        limits: {
          historyDays:          (limits as Record<string, unknown>).historyDays          as number  ?? fallback.historyDays,
          teamSeats:            (limits as Record<string, unknown>).teamSeats            as number  ?? fallback.teamSeats,
          businessProfiles:     (limits as Record<string, unknown>).businessProfiles     as number  ?? fallback.businessProfiles,
          savedPresets:         (limits as Record<string, unknown>).savedPresets         as number  ?? fallback.savedPresets,
          creditRolloverMonths: (limits as Record<string, unknown>).creditRolloverMonths as number  ?? fallback.creditRolloverMonths,
          watermark:            (limits as Record<string, unknown>).watermark            as boolean ?? fallback.watermark,
          pdfDownload:         ((limits as Record<string, unknown>).pdfDownload          as "none" | "branded" | "whitelabel") ?? fallback.pdfDownload,
          customUrl:            (limits as Record<string, unknown>).customUrl            as boolean ?? fallback.customUrl,
          usageReport:          (limits as Record<string, unknown>).usageReport          as boolean ?? fallback.usageReport,
          prioritySupport:      (limits as Record<string, unknown>).prioritySupport      as boolean ?? fallback.prioritySupport,
        },
      };
    });
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
