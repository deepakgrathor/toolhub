import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditTransaction, ToolOutput, User } from "@toolhub/db";

export const dynamic = "force-dynamic";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();

    const since30 = daysAgo(30);
    const since14 = daysAgo(14);

    // --- Daily credit purchases (revenue proxy) last 30 days ---
    const purchaseAgg = await CreditTransaction.aggregate([
      { $match: { type: "purchase", createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          credits: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // --- Daily credit deductions (consumed) last 30 days ---
    const deductAgg = await CreditTransaction.aggregate([
      { $match: { type: "use", createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          credits: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // --- Top 8 tools by usage ---
    const toolUsageAgg = await ToolOutput.aggregate([
      { $group: { _id: "$toolSlug", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // --- New users per day last 14 days ---
    const newUsersAgg = await User.aggregate([
      { $match: { createdAt: { $gte: since14 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // --- Active users (30d) ---
    const activeUsers = await User.countDocuments({
      lastSeen: { $gte: since30 },
    });

    // --- Total credits sold / consumed ---
    const [soldAgg, usedAgg] = await Promise.all([
      CreditTransaction.aggregate([
        { $match: { type: "purchase" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CreditTransaction.aggregate([
        { $match: { type: "use" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    // Build complete date arrays (fill gaps with 0)
    const purchaseMap = new Map(purchaseAgg.map((x) => [x._id, x.credits]));
    const deductMap = new Map(deductAgg.map((x) => [x._id, Math.abs(x.credits)]));
    const newUserMap = new Map(newUsersAgg.map((x) => [x._id, x.count]));

    const creditsSeries: { date: string; in: number; out: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      const k = dateKey(d);
      creditsSeries.push({ date: k, in: purchaseMap.get(k) ?? 0, out: deductMap.get(k) ?? 0 });
    }

    const newUsersSeries: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = daysAgo(i);
      const k = dateKey(d);
      newUsersSeries.push({ date: k, count: newUserMap.get(k) ?? 0 });
    }

    return NextResponse.json({
      activeUsers,
      creditsSold: soldAgg[0]?.total ?? 0,
      creditsConsumed: Math.abs(usedAgg[0]?.total ?? 0),
      creditsSeries,
      newUsersSeries,
      toolUsage: toolUsageAgg.map((x) => ({ slug: x._id, count: x.count })),
    });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
