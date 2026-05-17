import { connectDB, User, Plan, IPlanLimits, DEFAULT_LIMITS } from "@toolhub/db";
import { withCache, invalidateCache } from "@/lib/with-cache";

export type PlanSlug = "free" | "lite" | "pro" | "business" | "enterprise";

export async function getUserPlan(userId: string): Promise<PlanSlug> {
  return withCache<PlanSlug>(`plan:${userId}`, 300, async () => {
    await connectDB();
    const user = await User.findById(userId).select("plan").lean();
    return (user?.plan as PlanSlug | undefined) ?? "free";
  });
}

export async function getUserPlanLimits(userId: string): Promise<IPlanLimits> {
  return withCache<IPlanLimits>(`plan-limits:${userId}`, 300, async () => {
    await connectDB();
    const user = await User.findById(userId).select("plan").lean();
    const slug = (user?.plan as string) ?? "free";

    const plan = await Plan.findOne({ slug }).select("limits").lean();

    return (
      (plan?.limits as IPlanLimits) ??
      DEFAULT_LIMITS[slug] ??
      DEFAULT_LIMITS["free"]
    );
  });
}

export async function invalidatePlanLimitsCache(userId: string): Promise<void> {
  try {
    await invalidateCache(`plan-limits:${userId}`);
  } catch {
    // Silent fail — cache miss is acceptable
  }
}
