import { NextRequest, NextResponse } from "next/server";
import { connectDB, Referral, User, CreditService } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateBalance } from "@/lib/credit-cache";
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
    await User.findByIdAndUpdate(referredUser._id, { welcomeCreditGiven: true });
    await CreditService.addCredits(
      referredUser._id.toString(),
      referralCredit,
      "referral_bonus",
      { referredBy: referral.referrerId.toString(), approvedByAdmin: true }
    );
    await invalidateBalance(referredUser._id.toString());

    await createNotification({
      userId: referredUser._id.toString(),
      type: "credit_added",
      title: "Welcome Credits",
      message: `You got ${referralCredit} credits for joining SetuLix`,
    });
  }

  // Credit referrer — wrapped in try/catch so referred user is always credited first
  try {
    await CreditService.addCredits(
      referrer._id.toString(),
      referralCredit,
      "referral_reward",
      { referredUser: referral.referredId.toString(), approvedByAdmin: true }
    );
    await invalidateBalance(referrer._id.toString());

    const firstName = referredUser.name?.split(" ")[0] ?? "Someone";
    await createNotification({
      userId: referrer._id.toString(),
      type: "referral_joined",
      title: "Friend Joined!",
      message: `${firstName} joined SetuLix using your referral link. You got ${referralCredit} credits!`,
    });
  } catch (err) {
    console.error("[referrals/approve] Referrer credit failed:", err);
    // Continue — referred user already credited
  }

  await Referral.findByIdAndUpdate(id, { status: "completed", completedAt: new Date() });

  return NextResponse.json({ success: true });
}
