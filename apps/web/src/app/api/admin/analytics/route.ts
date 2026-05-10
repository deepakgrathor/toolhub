import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const rawDays = parseInt(searchParams.get("days") ?? "30", 10);
  const days = [7, 14, 30, 90].includes(rawDays) ? rawDays : 30;
  const userDays = Math.min(days, 14); // new users chart always max 14d

  try {
    await connectDB();

    const sinceMain = daysAgo(days);
    const sinceUsers = daysAgo(userDays);

    const [
      purchaseAgg,
      deductAgg,
      toolUsageAgg,
      toolCreditsAgg,
      newUsersAgg,
      activeUsers,
      soldAgg,
      usedAgg,
    ] = await Promise.all([
      // Daily credit purchases last N days
      CreditTransaction.aggregate([
        { $match: { type: "purchase", createdAt: { $gte: sinceMain } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, credits: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
      // Daily credit deductions last N days
      CreditTransaction.aggregate([
        { $match: { type: "use", createdAt: { $gte: sinceMain } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, credits: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
      // Top 8 tools by usage count (all time)
      ToolOutput.aggregate([
        { $group: { _id: "$toolSlug", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      // Credits consumed per tool (all time)
      CreditTransaction.aggregate([
        { $match: { type: "use", toolSlug: { $exists: true, $ne: null } } },
        { $group: { _id: "$toolSlug", credits: { $sum: "$amount" } } },
        { $sort: { credits: 1 } }, // ascending because amounts are negative
      ]),
      // New users per day
      User.aggregate([
        { $match: { createdAt: { $gte: sinceUsers } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Active users in window
      User.countDocuments({ lastSeen: { $gte: sinceMain } }),
      // Total credits sold all time
      CreditTransaction.aggregate([
        { $match: { type: "purchase" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Total credits used all time
      CreditTransaction.aggregate([
        { $match: { type: "use" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const purchaseMap = new Map(purchaseAgg.map((x) => [x._id, x.credits]));
    const deductMap = new Map(deductAgg.map((x) => [x._id, Math.abs(x.credits)]));
    const newUserMap = new Map(newUsersAgg.map((x) => [x._id, x.count]));

    const creditsSeries: { date: string; in: number; out: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const k = dateKey(d);
      creditsSeries.push({ date: k, in: purchaseMap.get(k) ?? 0, out: deductMap.get(k) ?? 0 });
    }

    const newUsersSeries: { date: string; count: number }[] = [];
    for (let i = userDays - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const k = dateKey(d);
      newUsersSeries.push({ date: k, count: newUserMap.get(k) ?? 0 });
    }

    return NextResponse.json({
      days,
      activeUsers,
      creditsSold: soldAgg[0]?.total ?? 0,
      creditsConsumed: Math.abs(usedAgg[0]?.total ?? 0),
      creditsSeries,
      newUsersSeries,
      toolUsage: toolUsageAgg.map((x) => ({ slug: x._id, count: x.count })),
      toolCredits: toolCreditsAgg.map((x) => ({ slug: x._id, credits: Math.abs(x.credits) })),
    });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
