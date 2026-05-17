import { NextRequest, NextResponse } from "next/server";
import { connectDB, CreditTransaction, User } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q")?.trim() || "";
  const type      = searchParams.get("type") || "";
  const direction = searchParams.get("direction") || "all";
  const startDate = searchParams.get("startDate") || "";
  const endDate   = searchParams.get("endDate") || "";
  const sortBy    = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page      = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  const allowedSortFields = ["createdAt", "amount", "balanceAfter"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};

  // Search by email or userId
  if (q) {
    const userFilter: mongoose.FilterQuery<{ _id: mongoose.Types.ObjectId }> = {
      $or: [{ email: { $regex: q, $options: "i" } }],
    };
    if (mongoose.Types.ObjectId.isValid(q)) {
      userFilter.$or!.push({ _id: new mongoose.Types.ObjectId(q) } as never);
    }
    const matchedUsers = await User.find(userFilter).select("_id").lean();
    const matchedIds = matchedUsers.map((u) => u._id);
    query.userId = { $in: matchedIds };
  }

  // Type filter
  const validTypes = [
    "purchase", "use", "refund", "referral_bonus", "referral_reward",
    "welcome_bonus", "manual_admin", "plan_upgrade", "credit_purchase", "rollover",
  ];
  if (type && validTypes.includes(type)) {
    query.type = type;
  }

  // Direction filter
  if (direction === "credit") query.amount = { $gt: 0 };
  else if (direction === "debit") query.amount = { $lt: 0 };

  // Date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [total, transactions] = await Promise.all([
    CreditTransaction.countDocuments(query),
    CreditTransaction.find(query)
      .sort({ [safeSortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  // Populate user info
  const userIds = [...new Set(transactions.map((t) => t.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } })
    .select("email name plan credits")
    .lean();
  const userMap = Object.fromEntries(users.map((u) => [(u._id as mongoose.Types.ObjectId).toString(), u]));

  const enriched = transactions.map((t) => ({
    ...t,
    _id: (t._id as mongoose.Types.ObjectId).toString(),
    userId: t.userId.toString(),
    user: userMap[t.userId.toString()] ?? null,
  }));

  // Summary stats for current page's user set
  let totalCreditsIn = 0;
  let totalCreditsOut = 0;
  const uniqueUserSet = new Set<string>();
  for (const t of transactions) {
    if (t.amount > 0) totalCreditsIn += t.amount;
    else totalCreditsOut += Math.abs(t.amount);
    uniqueUserSet.add(t.userId.toString());
  }

  return NextResponse.json({
    transactions: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    summary: {
      totalCreditsIn,
      totalCreditsOut,
      uniqueUsers: uniqueUserSet.size,
    },
  });
}
