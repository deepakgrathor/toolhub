import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile, Referral, CreditTransaction } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { getRecommendedTools } from "@/lib/recommendations";
import { createNotification } from "@/lib/notifications";

const REFERRAL_CREDIT = 10;
const WELCOME_CREDIT = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    professions?: string[];
    profession?: string;
    teamSize?: string;
    challenge?: string;
    kitName: string;
  };

  const { teamSize, challenge, kitName } = body;

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

  const recommendedTools = getRecommendedTools({ professions, teamSize, challenge });

  await User.findByIdAndUpdate(session.user.id, {
    profession: professions[0],
    professions,
    kitName,
    onboardingCompleted: true,
    onboardingStep: 4,
    selectedTools: recommendedTools,
  });

  await BusinessProfile.findOneAndUpdate(
    { userId: session.user.id },
    { userId: session.user.id, teamSize: teamSize ?? null },
    { upsert: true, new: true }
  );

  // ── Credit release on onboarding complete ──────────────────────────────────
  await releaseOnboardingCredits(session.user.id, session.user.name ?? "");

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

async function releaseOnboardingCredits(userId: string, userName: string): Promise<void> {
  try {
    const referral = await Referral.findOne({ referredId: userId, status: "pending" })
      .populate<{ referrerId: { _id: unknown; name: string; credits: number; welcomeCreditGiven: boolean } }>(
        "referrerId",
        "name credits welcomeCreditGiven"
      );

    if (referral) {
      // Referred user — check welcomeCreditGiven to avoid double credit
      const referredUser = await User.findById(userId).select("credits welcomeCreditGiven");
      if (!referredUser) return;

      if (!referredUser.welcomeCreditGiven) {
        referredUser.credits += REFERRAL_CREDIT;
        referredUser.welcomeCreditGiven = true;
        await referredUser.save();

        await CreditTransaction.create({
          userId,
          type: "referral_bonus",
          amount: REFERRAL_CREDIT,
          balanceAfter: referredUser.credits,
          meta: { referredBy: referral.referrerId._id?.toString() },
        });

        await createNotification({
          userId,
          type: "credit_added",
          title: "Welcome Credits",
          message: `You got ${REFERRAL_CREDIT} credits for joining SetuLix`,
        });

        // Invalidate referred user balance cache
        try {
          const redis = getRedis();
          await redis.del(`balance:${userId}`);
        } catch { /* silent */ }
      }

      // Referrer credit
      const referrerId = referral.referrerId._id?.toString() ?? "";
      const referrer = await User.findById(referrerId).select("credits name");
      if (referrer) {
        referrer.credits += REFERRAL_CREDIT;
        await referrer.save();

        await CreditTransaction.create({
          userId: referrerId,
          type: "referral_reward",
          amount: REFERRAL_CREDIT,
          balanceAfter: referrer.credits,
          meta: { referredUser: userId },
        });

        const firstName = userName.split(" ")[0] ?? "Someone";
        await createNotification({
          userId: referrerId,
          type: "referral_joined",
          title: "Friend Joined!",
          message: `${firstName} joined SetuLix using your referral link. You got ${REFERRAL_CREDIT} credits!`,
          meta: { referredUserId: userId },
        });

        try {
          const redis = getRedis();
          await redis.del(`balance:${referrerId}`);
        } catch { /* silent */ }
      }

      // Mark referral completed
      await Referral.findByIdAndUpdate(referral._id, {
        status: "completed",
        completedAt: new Date(),
      });

    } else {
      // No referral — give welcome bonus if not yet given
      const user = await User.findById(userId).select("credits welcomeCreditGiven");
      if (!user || user.welcomeCreditGiven) return;

      user.credits += WELCOME_CREDIT;
      user.welcomeCreditGiven = true;
      await user.save();

      await CreditTransaction.create({
        userId,
        type: "welcome_bonus",
        amount: WELCOME_CREDIT,
        balanceAfter: user.credits,
      });

      await createNotification({
        userId,
        type: "credit_added",
        title: "Welcome Credits",
        message: `You got ${WELCOME_CREDIT} credits to get started!`,
      });
    }
  } catch (err) {
    // Never break onboarding on credit error
    console.error("[releaseOnboardingCredits]", err);
  }
}
