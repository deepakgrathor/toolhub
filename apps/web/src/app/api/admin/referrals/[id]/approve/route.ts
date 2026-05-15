import { NextRequest, NextResponse } from "next/server";
import { connectDB, Referral, User, CreditTransaction } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedis } from "@toolhub/shared";
import { createNotification } from "@/lib/notifications";
import { getSiteConfigValue } from "@/lib/site-config-cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectDB();

  const referralCredit = await getSiteConfigValue('referral_reward_credits', 10) as number;

  const referral = await Referral.findById(id);
  if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (referral.status === "completed") {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  const [referredUser, referrer] = await Promise.all([
    User.findById(referral.referredId).select("credits welcomeCreditGiven name"),
    User.findById(referral.referrerId).select("credits name"),
  ]);

  if (!referredUser || !referrer) {
    return NextResponse.json({ error: "Users not found" }, { status: 404 });
  }

  // Credit referred user (only if not yet given)
  if (!referredUser.welcomeCreditGiven) {
    referredUser.credits += referralCredit;
    referredUser.welcomeCreditGiven = true;
    await referredUser.save();

    await CreditTransaction.create({
      userId: referredUser._id,
      type: "referral_bonus",
      amount: referralCredit,
      balanceAfter: referredUser.credits,
      meta: { referredBy: referral.referrerId.toString(), approvedByAdmin: true },
    });

    await createNotification({
      userId: referredUser._id.toString(),
      type: "credit_added",
      title: "Welcome Credits",
      message: `You got ${referralCredit} credits for joining SetuLix`,
    });
  }

  // Credit referrer
  referrer.credits += referralCredit;
  await referrer.save();

  await CreditTransaction.create({
    userId: referrer._id,
    type: "referral_reward",
    amount: referralCredit,
    balanceAfter: referrer.credits,
    meta: { referredUser: referral.referredId.toString(), approvedByAdmin: true },
  });

  const firstName = referredUser.name?.split(" ")[0] ?? "Someone";
  await createNotification({
    userId: referrer._id.toString(),
    type: "referral_joined",
    title: "Friend Joined!",
    message: `${firstName} joined SetuLix using your referral link. You got ${referralCredit} credits!`,
  });

  await Referral.findByIdAndUpdate(id, { status: "completed", completedAt: new Date() });

  // Invalidate balance caches
  try {
    const redis = getRedis();
    await Promise.all([
      redis.del(`balance:${referredUser._id.toString()}`),
      redis.del(`balance:${referrer._id.toString()}`),
    ]);
  } catch { /* silent */ }

  return NextResponse.json({ success: true });
}
