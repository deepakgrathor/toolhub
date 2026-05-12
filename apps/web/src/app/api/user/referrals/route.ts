import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, Referral, CreditTransaction } from "@toolhub/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://setulix.com";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select("referralCode name").lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const refCode = user.referralCode ?? "";
  const refLink = refCode ? `${BASE_URL}?ref=${refCode}` : "";

  const [allReferrals, creditTxns] = await Promise.all([
    Referral.find({ referrerId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate<{ referredId: { name: string } }>("referredId", "name")
      .lean(),
    CreditTransaction.find({
      userId: session.user.id,
      type: "referral_reward",
    })
      .select("amount")
      .lean(),
  ]);

  const total = allReferrals.length;
  const completed = allReferrals.filter((r) => r.status === "completed").length;
  const creditsEarned = creditTxns.reduce((sum, tx) => sum + tx.amount, 0);

  const recent = allReferrals.slice(0, 10).map((r) => {
    const fullName =
      typeof r.referredId === "object" && r.referredId !== null && "name" in r.referredId
        ? (r.referredId as { name: string }).name
        : "Unknown";
    const nameParts = fullName.split(" ");
    const partial =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[1]?.[0] ?? ""}.`
        : `${fullName[0] ?? "?"}***`;
    return {
      id: r._id.toString(),
      name: partial,
      status: r.status,
      date: r.createdAt,
    };
  });

  return NextResponse.json({
    refCode,
    refLink,
    stats: { total, completed, creditsEarned },
    recent,
  });
}
