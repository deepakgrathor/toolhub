import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, CreditTransaction } from "@toolhub/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select("referralCode referralCount")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const referralCode = user.referralCode ?? "";
  const referralLink = referralCode
    ? `${process.env.NEXTAUTH_URL ?? ""}?ref=${referralCode}`
    : "";

  const agg = await CreditTransaction.aggregate([
    {
      $match: {
        userId: user._id,
        type: "referral_bonus",
        amount: { $gt: 0 },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const creditsEarned: number = agg[0]?.total ?? 0;

  return NextResponse.json({
    referralCode,
    referralLink,
    referralCount: user.referralCount ?? 0,
    creditsEarned,
  });
}
