import { getRedis } from "@toolhub/shared";
import { createNotification } from "@/lib/notifications";

const PLAN_CREDITS: Record<string, number> = {
  free: 10,
  lite: 200,
  pro: 700,
  business: 1500,
  enterprise: 9999,
};

export async function checkAndSendCreditAlert(
  userId: string,
  currentBalance: number,
  planSlug: string
): Promise<void> {
  try {
    const planCredits = PLAN_CREDITS[planSlug] ?? 10;
    const threshold = planCredits * 0.2;

    if (currentBalance > threshold) return;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const redisKey = `credit_alert_sent:${userId}:${monthKey}`;

    const redis = getRedis();
    const alreadySent = await redis.get(redisKey);
    if (alreadySent) return;

    await createNotification({
      userId,
      type: "credit_added",
      title: "Credits Running Low",
      message: `You have ${currentBalance} credits left. Upgrade or buy more to keep going.`,
    });

    // TTL = seconds until end of current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const ttlSeconds = Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
    await redis.set(redisKey, "1", { ex: Math.max(ttlSeconds, 1) });
  } catch {
    // Never throw — email/alert failure must not break tool usage
  }
}
