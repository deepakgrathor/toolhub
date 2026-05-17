import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, User } from "@toolhub/db";

export const dynamic = "force-dynamic";

function escapeCsv(val: unknown): string {
  return `"${String(val ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const users = await User.find()
    .select("name email purchasedCredits subscriptionCredits rolloverCredits plan role isBanned authProvider createdAt lastSeen")
    .sort({ createdAt: -1 })
    .lean();

  const header = ["Name", "Email", "Credits", "Plan", "Role", "Banned", "Auth Provider", "Joined", "Last Seen"];
  const rows = users.map((u) => [
    u.name,
    u.email,
    (u.purchasedCredits ?? 0) + (u.subscriptionCredits ?? 0) + (u.rolloverCredits ?? 0),
    u.plan,
    u.role,
    u.isBanned ? "Yes" : "No",
    u.authProvider,
    u.createdAt.toISOString(),
    u.lastSeen.toISOString(),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const date = new Date().toISOString().split("T")[0];
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="setulix-users-${date}.csv"`,
    },
  });
}
