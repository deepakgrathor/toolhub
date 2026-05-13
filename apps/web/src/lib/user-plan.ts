import { connectDB, User } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

export type PlanSlug = "free" | "lite" | "pro" | "business" | "enterprise";

export async function getUserPlan(userId: string): Promise<PlanSlug> {
  try {
    const redis = getRedis();
    const cached = await redis.get(`plan:${userId}`);
    if (cached) return cached as PlanSlug;
  } catch {
    // Redis unavailable
  }

  await connectDB();
  const user = await User.findById(userId).select("plan").lean();
  const plan = (user?.plan as PlanSlug | undefined) ?? "free";

  try {
    const redis = getRedis();
    await redis.set(`plan:${userId}`, plan, { ex: 300 });
  } catch {
    // silent
  }

  return plan;
}
