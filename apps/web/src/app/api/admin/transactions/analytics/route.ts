import { NextRequest, NextResponse } from "next/server";
import { connectDB, CreditTransaction, User } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalIn,
    totalOut,
    byType,
    dailyTrend,
    topUsersRaw,
    topTools,
    todayCount,
  ] = await Promise.all([
    // Total credits issued (all positive)
    CreditTransaction.aggregate([
      { $match: { amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    // Total credits consumed (all negative)
    CreditTransaction.aggregate([
      { $match: { amount: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    // Breakdown by type
    CreditTransaction.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
      { $sort: { count: -1 } },
    ]),

    // Daily trend — last 30 days
    CreditTransaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
            day:   { $dayOfMonth: "$createdAt" },
          },
          creditsIn:  { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
          creditsOut: { $sum: { $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),

    // Top 10 users by credits consumed
    CreditTransaction.aggregate([
      { $match: { amount: { $lt: 0 } } },
      { $group: { _id: "$userId", totalConsumed: { $sum: { $abs: "$amount" } }, count: { $sum: 1 } } },
      { $sort: { totalConsumed: -1 } },
      { $limit: 10 },
    ]),

    // Top 10 tools by usage count
    CreditTransaction.aggregate([
      { $match: { type: "use", toolSlug: { $exists: true, $ne: null } } },
      { $group: { _id: "$toolSlug", count: { $sum: 1 }, totalCredits: { $sum: { $abs: "$amount" } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Transactions today
    CreditTransaction.countDocuments({ createdAt: { $gte: todayStart } }),
  ]);

  // Enrich top users with email/name
  const topUserIds = topUsersRaw.map((u: { _id: mongoose.Types.ObjectId }) => u._id);
  const topUserDocs = await User.find({ _id: { $in: topUserIds } })
    .select("email name plan")
    .lean();
  const topUserMap = Object.fromEntries(
    topUserDocs.map((u) => [(u._id as mongoose.Types.ObjectId).toString(), u])
  );
  const topUsers = topUsersRaw.map((u: { _id: mongoose.Types.ObjectId; totalConsumed: number; count: number }) => ({
    userId: u._id.toString(),
    totalConsumed: u.totalConsumed,
    count: u.count,
    user: topUserMap[u._id.toString()] ?? null,
  }));

  // Format daily trend
  const daily = dailyTrend.map((d: { _id: { year: number; month: number; day: number }; creditsIn: number; creditsOut: number; count: number }) => ({
    date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(d._id.day).padStart(2, "0")}`,
    creditsIn: d.creditsIn,
    creditsOut: d.creditsOut,
    count: d.count,
  }));

  return NextResponse.json({
    totalCreditsIssued:   totalIn[0]?.total  ?? 0,
    totalCreditsConsumed: Math.abs(totalOut[0]?.total ?? 0),
    todayCount,
    byType: byType.map((t: { _id: string; count: number; totalAmount: number }) => ({
      type:        t._id,
      count:       t.count,
      totalAmount: t.totalAmount,
    })),
    dailyTrend: daily,
    topUsers,
    topTools: topTools.map((t: { _id: string; count: number; totalCredits: number }) => ({
      toolSlug:     t._id,
      count:        t.count,
      totalCredits: t.totalCredits,
    })),
  });
}
