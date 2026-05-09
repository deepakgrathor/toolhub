import type { Metadata } from "next";
import { connectDB, User, CreditTransaction, ToolOutput } from "@toolhub/db";
import { UsersTable } from "@/components/admin/UsersTable";
import mongoose from "mongoose";

export const metadata: Metadata = { title: "Admin Users — SetuLix" };
export const dynamic = "force-dynamic";

export interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  credits: number;
  creditsBought: number;
  creditsUsed: number;
  toolsRun: number;
  plan: string;
  role: string;
  isBanned: boolean;
  lastSeen: string;
  createdAt: string;
}

interface Props {
  searchParams: Promise<{ q?: string }>;
}

async function getUsers(query?: string): Promise<AdminUserRow[]> {
  try {
    await connectDB();

    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    if (users.length === 0) return [];

    const userIds = users.map((u) => u._id);

    const [boughtAgg, usedAgg, toolCountAgg] = await Promise.all([
      CreditTransaction.aggregate([
        { $match: { userId: { $in: userIds }, type: "purchase" } },
        { $group: { _id: "$userId", total: { $sum: "$amount" } } },
      ]),
      CreditTransaction.aggregate([
        { $match: { userId: { $in: userIds }, type: "use" } },
        { $group: { _id: "$userId", total: { $sum: "$amount" } } },
      ]),
      ToolOutput.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
    ]);

    const boughtMap = new Map(boughtAgg.map((x) => [x._id.toString(), x.total]));
    const usedMap = new Map(usedAgg.map((x) => [x._id.toString(), Math.abs(x.total)]));
    const toolMap = new Map(toolCountAgg.map((x) => [x._id.toString(), x.count]));

    return users.map((u) => {
      const id = (u._id as mongoose.Types.ObjectId).toString();
      return {
        _id: id,
        name: u.name,
        email: u.email,
        credits: u.credits,
        creditsBought: boughtMap.get(id) ?? 0,
        creditsUsed: usedMap.get(id) ?? 0,
        toolsRun: toolMap.get(id) ?? 0,
        plan: u.plan,
        role: u.role,
        isBanned: (u as { isBanned?: boolean }).isBanned ?? false,
        lastSeen: u.lastSeen.toISOString(),
        createdAt: u.createdAt.toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim();
  const users = await getUsers(query);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Users</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {query
          ? `${users.length} result${users.length === 1 ? "" : "s"} for "${query}"`
          : `${users.length} users — showing most recent 100`}
      </p>
      <UsersTable initialUsers={users} initialQuery={query ?? ""} />
    </div>
  );
}
