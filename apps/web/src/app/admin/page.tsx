import type { Metadata } from "next";
import { connectDB, User, ToolConfig, CreditTransaction } from "@toolhub/db";
import { Users, Wrench, Coins, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Overview — Toolspire" };
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    await connectDB();

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeTools,
      creditsSoldResult,
      creditsThisMonthResult,
    ] = await Promise.all([
      User.countDocuments(),
      ToolConfig.countDocuments({ isActive: true }),
      CreditTransaction.aggregate([
        { $match: { type: "purchase" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CreditTransaction.aggregate([
        { $match: { type: "purchase", createdAt: { $gte: firstOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return {
      totalUsers,
      activeTools,
      creditsSold: creditsSoldResult[0]?.total ?? 0,
      creditsThisMonth: creditsThisMonthResult[0]?.total ?? 0,
    };
  } catch {
    return { totalUsers: 0, activeTools: 0, creditsSold: 0, creditsThisMonth: 0 };
  }
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const CARDS = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString("en-IN"),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Active Tools",
      value: stats.activeTools.toLocaleString("en-IN"),
      icon: Wrench,
      color: "text-[#7c3aed]",
      bg: "bg-[#7c3aed]/10",
    },
    {
      label: "Credits Sold",
      value: stats.creditsSold.toLocaleString("en-IN"),
      icon: Coins,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
    },
    {
      label: "Credits This Month",
      value: stats.creditsThisMonth.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-foreground mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-[#111111] p-5 flex items-center gap-4"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                bg
              )}
            >
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
