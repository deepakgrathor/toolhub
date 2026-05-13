import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile, Referral, CreditTransaction, SiteConfig } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
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

  // TODO(B5-B): Once Razorpay/Cashfree webhook route is created at
  // apps/web/src/app/api/payments/webhook/route.ts, call createNotification
  // there on successful purchase:
  //   createNotification({ userId, type: 'purchase_success',
  //     title: 'Purchase Successful',
  //     message: `${credits} credits added to your account`,
  //     meta: { credits, orderId } })

  // Invalidate user + workspace cache
  try {
    const redis = getRedis();
    await Promise.all([
      redis.del(`SetuLix:user:${session.user.id}`),
      redis.del(`workspace:${session.user.id}`),
      redis.del(`balance:${session.user.id}`),
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

      await User.findByIdAndUpdate(userId, {
        $inc: { credits: joiningBonus },
        welcomeCreditGiven: true,
      });
      const referredNewBalance = (referredUser.credits ?? 0) + joiningBonus;

      await CreditTransaction.create({
        userId,
        type: "referral_bonus",
        amount: joiningBonus,
        note: "Joining bonus — joined via referral link",
        balanceAfter: referredNewBalance,
        meta: { referredBy: referral.referrerId?.toString() },
      });

      await createNotification({
        userId,
        type: "credit_added",
        title: "Joining Bonus!",
        message: `You got ${joiningBonus} credits for joining via referral link.`,
      });

      // ── Referrer: give reward ──────────────────────────────────────────────
      const referrerId = referral.referrerId?.toString() ?? "";
      const referrer = await User.findById(referrerId).select("credits");
      if (referrer) {
        await User.findByIdAndUpdate(referrerId, { $inc: { credits: referrerReward } });
        const referrerNewBalance = (referrer.credits ?? 0) + referrerReward;

        await CreditTransaction.create({
          userId: referrerId,
          type: "referral_reward",
          amount: referrerReward,
          note: "Referral reward — friend joined SetuLix",
          balanceAfter: referrerNewBalance,
          meta: { referredUser: userId },
        });

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

      // ── Invalidate both users' balance cache ───────────────────────────────
      try {
        const redis = getRedis();
        await Promise.all([
          redis.del(`balance:${userId}`),
          ...(referrerId ? [redis.del(`balance:${referrerId}`)] : []),
        ]);
      } catch { /* silent */ }

    } else {
      // ── Direct signup: give welcome bonus ──────────────────────────────────
      const user = await User.findById(userId).select("credits welcomeCreditGiven");
      if (!user || user.welcomeCreditGiven) return;

      await User.findByIdAndUpdate(userId, {
        $inc: { credits: welcomeBonus },
        welcomeCreditGiven: true,
      });
      const newBalance = (user.credits ?? 0) + welcomeBonus;

      await CreditTransaction.create({
        userId,
        type: "welcome_bonus",
        amount: welcomeBonus,
        note: "Welcome to SetuLix",
        balanceAfter: newBalance,
      });

      await createNotification({
        userId,
        type: "credit_added",
        title: "Welcome to SetuLix!",
        message: `You got ${welcomeBonus} free credits to get started.`,
      });

      try {
        const redis = getRedis();
        await redis.del(`balance:${userId}`);
      } catch { /* silent */ }
    }
  } catch (err) {
    console.error("[releaseOnboardingCredits]", err);
  }
}
