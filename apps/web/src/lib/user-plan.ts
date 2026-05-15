import { connectDB, User } from "@toolhub/db";
import { withCache } from "@/lib/with-cache";

export type PlanSlug = "free" | "lite" | "pro" | "business" | "enterprise";

export async function getUserPlan(userId: string): Promise<PlanSlug> {
  return withCache<PlanSlug>(`plan:${userId}`, 300, async () => {
    await connectDB();
    const user = await User.findById(userId).select("plan").lean();
    return (user?.plan as PlanSlug | undefined) ?? "free";
  });
}
