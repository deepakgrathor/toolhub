import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditTransaction, User } from "@toolhub/db";
import mongoose from "mongoose";
import { TOOL_NAME_MAP } from "@/lib/tool-names";

const LIMIT = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const filter = searchParams.get("filter") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip = (page - 1) * LIMIT;

  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const matchFilter: Record<string, unknown> = { userId };
  if (filter === "earned") {
    matchFilter.amount = { $gt: 0 };
  } else if (filter === "spent") {
    matchFilter.amount = { $lt: 0 };
  }

  const [transactions, totalCount, user] = await Promise.all([
    CreditTransaction.find(matchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(LIMIT)
      .lean(),
    CreditTransaction.countDocuments(matchFilter),
    User.findById(session.user.id)
      .select("purchasedCredits subscriptionCredits rolloverCredits")
      .lean(),
  ]);

  // Summary stats (always from all transactions, not filtered)
  const [earnedAgg, spentAgg, thisMonthAgg] = await Promise.all([
    CreditTransaction.aggregate([
      { $match: { userId, amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CreditTransaction.aggregate([
      { $match: { userId, amount: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CreditTransaction.aggregate([
      {
        $match: {
          userId,
          amount: { $lt: 0 },
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const enriched = transactions.map((tx) => ({
    _id: tx._id,
    type: tx.type,
    amount: tx.amount,
    balanceAfter: tx.balanceAfter,
    note: tx.note,
    toolSlug: tx.toolSlug,
    toolName: tx.toolSlug ? (TOOL_NAME_MAP[tx.toolSlug] ?? tx.toolSlug) : undefined,
    meta: tx.meta,
    createdAt: tx.createdAt,
  }));

  return NextResponse.json({
    transactions: enriched,
    totalCount,
    totalPages: Math.ceil(totalCount / LIMIT),
    page,
    summary: {
      balance:
        (user?.purchasedCredits ?? 0) +
        (user?.subscriptionCredits ?? 0) +
        (user?.rolloverCredits ?? 0),
      earned: earnedAgg[0]?.total ?? 0,
      spent: Math.abs(spentAgg[0]?.total ?? 0),
      thisMonth: Math.abs(thisMonthAgg[0]?.total ?? 0),
      transactionCount: await CreditTransaction.countDocuments({ userId }),
    },
  });
}
