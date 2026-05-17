import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile, Referral, SiteConfig, CreditService } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { invalidateBalance } from "@/lib/credit-cache";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/sender";
import { welcomeEmail } from "@/lib/email/templates";

async function getCreditSetting(key: string, fallback: number): Promise<number> {
  try {
    const record = await SiteConfig.findOne({ key }).lean();
    if (record && typeof record.value === "number") return record.value;
  } catch { /* silent */ }
  return fallback;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    professions?: string[];
    profession?: string;
    teamSize?: string;
    kitName: string;
  };

  const { teamSize, kitName } = body;

  const professions: string[] =
    Array.isArray(body.professions) && body.professions.length > 0
      ? body.professions
      : body.profession
      ? [body.profession]
      : [];

  if (professions.length === 0 || !kitName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();

  await User.findByIdAndUpdate(session.user.id, {
    profession: professions[0],
    professions,
    kitName,
    onboardingCompleted: true,
    onboardingStep: 4,
  });

  await BusinessProfile.findOneAndUpdate(
    { userId: session.user.id },
    { userId: session.user.id, teamSize: teamSize ?? null },
    { upsert: true, new: true }
  );

  // ── Credit release on onboarding complete ──────────────────────────────────
  await releaseOnboardingCredits(session.user.id);

  // ── Welcome email ──────────────────────────────────────────────────────────
  if (session.user.email) {
    const { subject, html } = welcomeEmail({ name: session.user.name ?? "there" });
    void sendEmail({ to: session.user.email, subject, html });
  }

  // Invalidate user + workspace cache (not credit cache — releaseOnboardingCredits handles that)
  try {
    const redis = getRedis();
    await Promise.all([
      redis.del(`SetuLix:user:${session.user.id}`),
      redis.del(`workspace:${session.user.id}`),
    ]);
  } catch {
    // silent
  }

  return NextResponse.json({ success: true, updateSession: true });
}

async function releaseOnboardingCredits(userId: string): Promise<void> {
  try {
    const [welcomeBonus, joiningBonus, referrerReward] = await Promise.all([
      getCreditSetting("welcome_bonus_credits", 10),
      getCreditSetting("referral_joining_bonus", 10),
      getCreditSetting("referral_reward_credits", 10),
    ]);

    const referral = await Referral.findOne({ referredId: userId, status: "pending" });

    if (referral && referral.status !== "suspicious") {
      // ── Referred user: give joining bonus ─────────────────────────────────
      const referredUser = await User.findById(userId).select("credits welcomeCreditGiven");
      if (!referredUser || referredUser.welcomeCreditGiven) return;

      await User.findByIdAndUpdate(userId, { welcomeCreditGiven: true });
      await CreditService.addCredits(userId, joiningBonus, "referral_bonus", {
        referredBy: referral.referrerId?.toString(),
      });
      await invalidateBalance(userId);

      await createNotification({
        userId,
        type: "credit_added",
        title: "Joining Bonus!",
        message: `You got ${joiningBonus} credits for joining via referral link.`,
      });

      // ── Referrer: give reward ──────────────────────────────────────────────
      const referrerId = referral.referrerId?.toString() ?? "";
      if (referrerId) {
        await CreditService.addCredits(referrerId, referrerReward, "referral_reward", {
          referredUser: userId,
        });
        await invalidateBalance(referrerId);

        await createNotification({
          userId: referrerId,
          type: "referral_joined",
          title: "Friend Joined!",
          message: `Your referral joined SetuLix. You got ${referrerReward} credits!`,
          meta: { referredUserId: userId },
        });
      }

      // ── Mark referral completed ────────────────────────────────────────────
      await Referral.findByIdAndUpdate(referral._id, {
        status: "completed",
        completedAt: new Date(),
      });

    } else {
      // ── Direct signup: give welcome bonus ──────────────────────────────────
      const user = await User.findById(userId).select("credits welcomeCreditGiven");
      if (!user || user.welcomeCreditGiven) return;

      await User.findByIdAndUpdate(userId, { welcomeCreditGiven: true });
      await CreditService.addCredits(userId, welcomeBonus, "welcome_bonus");
      await invalidateBalance(userId);

      await createNotification({
        userId,
        type: "credit_added",
        title: "Welcome to SetuLix!",
        message: `You got ${welcomeBonus} free credits to get started.`,
      });
    }
  } catch (err) {
    console.error("[releaseOnboardingCredits]", err);
  }
}
