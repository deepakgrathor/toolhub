import type { Metadata } from "next";
import { connectDB, User, ToolConfig, CreditTransaction } from "@toolhub/db";
import { Users, Wrench, Coins, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";

export const metadata: Metadata = { title: "Admin Analytics — SetuLix" };
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    await connectDB();

    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      activeTools,
      creditsSoldResult,
      creditsUsedResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastSeen: { $gte: since30 } }),
      ToolConfig.countDocuments({ isActive: true }),
      CreditTransaction.aggregate([
        { $match: { type: "purchase" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CreditTransaction.aggregate([
        { $match: { type: "use" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return {
      totalUsers,
      activeUsers,
      activeTools,
      creditsSold: creditsSoldResult[0]?.total ?? 0,
      creditsConsumed: Math.abs(creditsUsedResult[0]?.total ?? 0),
    };
  } catch {
    return { totalUsers: 0, activeUsers: 0, activeTools: 0, creditsSold: 0, creditsConsumed: 0 };
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
      border: "border-l-blue-400",
    },
    {
      label: "Active (30d)",
      value: stats.activeUsers.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "text-[#7c3aed]",
      bg: "bg-[#7c3aed]/10",
      border: "border-l-[#7c3aed]",
    },
    {
      label: "Credits Sold",
      value: stats.creditsSold.toLocaleString("en-IN"),
      icon: Coins,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
      border: "border-l-[#10b981]",
    },
    {
      label: "Credits Consumed",
      value: stats.creditsConsumed.toLocaleString("en-IN"),
      icon: Wrench,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-l-orange-400",
    },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-foreground mb-1">Analytics</h1>
      <p className="text-sm text-muted-foreground mb-6">Platform overview — last 30 days</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={cn(
              "rounded-xl border border-border border-l-4 bg-[#111111] p-5 flex items-center gap-4",
              border
            )}
          >
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <AnalyticsCharts />
    </div>
  );
}
