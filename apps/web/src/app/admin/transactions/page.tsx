import type { Metadata } from "next";
import { connectDB, CreditTransaction, User } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";
import { TransactionsTable } from "@/components/admin/TransactionsTable";
import mongoose from "mongoose";

export const metadata: Metadata = { title: "Transaction History — Admin" };
export const dynamic = "force-dynamic";

export interface AdminTransactionRow {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  toolSlug?: string | null;
  note?: string | null;
  createdAt: string;
  user: {
    _id: string;
    email: string;
    name: string;
    plan: string;
    credits: number;
  } | null;
}

export interface TransactionPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TransactionSummary {
  totalCreditsIn: number;
  totalCreditsOut: number;
  uniqueUsers: number;
}

export interface TransactionAnalytics {
  totalCreditsIssued: number;
  totalCreditsConsumed: number;
  todayCount: number;
  byType: { type: string; count: number; totalAmount: number }[];
}

interface Props {
  searchParams: Promise<Record<string, string>>;
}

const VALID_TYPES = [
  "purchase", "use", "refund", "referral_bonus", "referral_reward",
  "welcome_bonus", "manual_admin", "plan_upgrade", "credit_purchase", "rollover",
];

async function getTransactions(params: Record<string, string>) {
  try {
    await connectDB();

    const q         = params.q?.trim() || "";
    const type      = params.type || "";
    const direction = params.direction || "all";
    const startDate = params.startDate || "";
    const endDate   = params.endDate || "";
    const sortBy    = params.sortBy || "createdAt";
    const sortOrder = params.sortOrder || "desc";
    const page      = Math.max(1, parseInt(params.page || "1", 10));
    const limit     = Math.min(100, Math.max(1, parseInt(params.limit || "50", 10)));

    const allowedSort = ["createdAt", "amount", "balanceAfter"];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : "createdAt";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (q) {
      const userFilter: mongoose.FilterQuery<{ _id: mongoose.Types.ObjectId }> = {
        $or: [{ email: { $regex: q, $options: "i" } }],
      };
      if (mongoose.Types.ObjectId.isValid(q)) {
        userFilter.$or!.push({ _id: new mongoose.Types.ObjectId(q) } as never);
      }
      const matched = await User.find(userFilter).select("_id").lean();
      query.userId = { $in: matched.map((u) => u._id) };
    }

    if (type && VALID_TYPES.includes(type)) query.type = type;
    if (direction === "credit") query.amount = { $gt: 0 };
    else if (direction === "debit") query.amount = { $lt: 0 };

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

    const userIds = [...new Set(transactions.map((t) => t.userId.toString()))];
    const usersRaw = await User.find({ _id: { $in: userIds } })
      .select("email name plan purchasedCredits subscriptionCredits rolloverCredits")
      .lean();
    const userMap = Object.fromEntries(
      usersRaw.map((u) => [(u._id as mongoose.Types.ObjectId).toString(), u])
    );

    const rows: AdminTransactionRow[] = transactions.map((t) => {
      const uid = t.userId.toString();
      const u = userMap[uid];
      return {
        _id: (t._id as mongoose.Types.ObjectId).toString(),
        userId: uid,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        toolSlug: t.toolSlug ?? null,
        note: t.note ?? null,
        createdAt: t.createdAt.toISOString(),
        user: u
          ? {
              _id: (u._id as mongoose.Types.ObjectId).toString(),
              email: u.email,
              name: u.name,
              plan: u.plan,
              credits:
                (u.purchasedCredits ?? 0) +
                (u.subscriptionCredits ?? 0) +
                (u.rolloverCredits ?? 0),
            }
          : null,
      };
    });

    let totalCreditsIn = 0;
    let totalCreditsOut = 0;
    const uniqueSet = new Set<string>();
    for (const t of transactions) {
      if (t.amount > 0) totalCreditsIn += t.amount;
      else totalCreditsOut += Math.abs(t.amount);
      uniqueSet.add(t.userId.toString());
    }

    return {
      transactions: rows,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      } as TransactionPagination,
      summary: { totalCreditsIn, totalCreditsOut, uniqueUsers: uniqueSet.size } as TransactionSummary,
    };
  } catch {
    return null;
  }
}

async function getAnalytics(): Promise<TransactionAnalytics> {
  try {
    await connectDB();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalInAgg, totalOutAgg, byTypeAgg, todayCount] = await Promise.all([
      CreditTransaction.aggregate([
        { $match: { amount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CreditTransaction.aggregate([
        { $match: { amount: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CreditTransaction.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
        { $sort: { count: -1 } },
      ]),
      CreditTransaction.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    return {
      totalCreditsIssued:   totalInAgg[0]?.total ?? 0,
      totalCreditsConsumed: Math.abs(totalOutAgg[0]?.total ?? 0),
      todayCount,
      byType: byTypeAgg.map((t: { _id: string; count: number; totalAmount: number }) => ({
        type: t._id, count: t.count, totalAmount: t.totalAmount,
      })),
    };
  } catch {
    return { totalCreditsIssued: 0, totalCreditsConsumed: 0, todayCount: 0, byType: [] };
  }
}

export default async function AdminTransactionsPage({ searchParams }: Props) {
  // Auth guard
  const cookieStore = await cookies();
  const token = cookieStore.get("setulix_admin")?.value;
  const admin = token ? await verifyAdminToken(token) : null;
  if (!admin) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }

  const params = await searchParams;
  const [txnData, analytics] = await Promise.all([
    getTransactions(params),
    getAnalytics(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Transaction History</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Complete credit trail across all users
      </p>
      <TransactionsTable
        initialTransactions={txnData?.transactions ?? []}
        initialPagination={txnData?.pagination ?? {
          total: 0, page: 1, limit: 50, totalPages: 0, hasNext: false, hasPrev: false,
        }}
        initialSummary={txnData?.summary ?? { totalCreditsIn: 0, totalCreditsOut: 0, uniqueUsers: 0 }}
        initialAnalytics={analytics}
        initialQuery={params}
      />
    </div>
  );
}
