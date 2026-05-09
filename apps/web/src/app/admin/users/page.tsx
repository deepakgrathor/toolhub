import type { Metadata } from "next";
import { connectDB, User } from "@toolhub/db";
import { UsersTable } from "@/components/admin/UsersTable";

export const metadata: Metadata = { title: "Admin Users — Toolspire" };
export const dynamic = "force-dynamic";

export interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  credits: number;
  plan: string;
  role: string;
  createdAt: string;
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

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      credits: u.credits,
      plan: u.plan,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

interface Props {
  searchParams: { q?: string };
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const query = searchParams.q?.trim();
  const users = await getUsers(query);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Users</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {query
          ? `${users.length} result${users.length === 1 ? "" : "s"} for "${query}"`
          : `${users.length} total — showing most recent 100`}
      </p>
      <UsersTable initialUsers={users} initialQuery={query ?? ""} />
    </div>
  );
}
