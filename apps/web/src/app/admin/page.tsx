import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, User, ToolConfig, CreditTransaction, SiteConfig, Preset } from "@toolhub/db";
import { Users, Wrench, Coins, TrendingUp, AlertTriangle, UserPlus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { SystemHealth } from "@/components/admin/SystemHealth";
import { AnnouncementToggle } from "@/components/admin/AnnouncementToggle";

export const metadata: Metadata = { title: "Admin Analytics — SetuLix" };
export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

async function getDashboardData() {
  try {
    await connectDB();

    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      activeTools,
      creditsConsumedResult,
      recentUsers,
      lowCreditCount,
      announcementBanner,
      announcementVisible,
      totalPresets,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastSeen: { $gte: since30 } }),
      ToolConfig.countDocuments({ isActive: true }),
      CreditTransaction.aggregate([
        { $match: { type: "use" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(8).lean(),
      User.countDocuments({ credits: { $lt: 5 }, role: "user" }),
      SiteConfig.findOne({ key: "announcement_banner" }).lean(),
      SiteConfig.findOne({ key: "announcement_visible" }).lean(),
      Preset.countDocuments(),
    ]);

    return {
      totalUsers,
      activeUsers,
      activeTools,
      creditsConsumed: Math.abs(creditsConsumedResult[0]?.total ?? 0),
      totalPresets,
      recentUsers: recentUsers.map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        credits: u.credits,
        authProvider: u.authProvider,
        createdAt: u.createdAt,
      })),
      lowCreditCount,
      announcementText: (announcementBanner?.value as string) ?? "",
      announcementVisible: (announcementVisible?.value as boolean) ?? false,
    };
  } catch {
    return {
      totalUsers: 0, activeUsers: 0, activeTools: 0, creditsConsumed: 0,
      totalPresets: 0,
      recentUsers: [], lowCreditCount: 0, announcementText: "", announcementVisible: false,
    };
  }
}

export default async function AdminOverviewPage() {
  const stats = await getDashboardData();

  const CARDS = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString("en-IN"),
      sub: "all time",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      accent: "border-l-blue-400",
    },
    {
      label: "Active (30d)",
      value: stats.activeUsers.toLocaleString("en-IN"),
      sub: `${stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total`,
      icon: TrendingUp,
      color: "text-[#7c3aed]",
      bg: "bg-[#7c3aed]/10",
      accent: "border-l-[#7c3aed]",
    },
    {
      label: "Active Tools",
      value: stats.activeTools.toLocaleString("en-IN"),
      sub: "enabled in admin",
      icon: Wrench,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
      accent: "border-l-[#10b981]",
    },
    {
      label: "Credits Consumed",
      value: stats.creditsConsumed.toLocaleString("en-IN"),
      sub: "all time usage",
      icon: Coins,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      accent: "border-l-orange-400",
    },
    {
      label: "Saved Presets",
      value: stats.totalPresets.toLocaleString("en-IN"),
      sub: "across all PRO users",
      icon: BookOpen,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      accent: "border-l-pink-400",
    },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform overview — last 30 days</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {CARDS.map(({ label, value, sub, icon: Icon, color, bg, accent }) => (
          <div key={label} className={cn("rounded-xl border border-border border-l-4 bg-card p-5", accent)}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", bg)}>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground leading-none tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Low credit alert */}
      {stats.lowCreditCount > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
          <p className="text-sm text-orange-300">
            <span className="font-semibold">{stats.lowCreditCount} user{stats.lowCreditCount > 1 ? "s" : ""}</span>
            {" "}ha{stats.lowCreditCount > 1 ? "ve" : "s"} fewer than 5 credits remaining.
          </p>
          <Link
            href="/admin/users"
            className="ml-auto text-xs font-medium text-orange-400 hover:text-orange-300 shrink-0 transition-colors"
          >
            View Users →
          </Link>
        </div>
      )}

      {/* Recent signups + side widgets */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent signups */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Recent Signups</h3>
            </div>
            <Link href="/admin/users" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>

          {stats.recentUsers.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted-foreground text-center">No users yet</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 rounded-full bg-[#7c3aed]/20 flex items-center justify-center text-xs font-bold text-[#7c3aed] shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground tabular-nums">{u.credits} cr</p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(u.createdAt)}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                    u.authProvider === "google"
                      ? "bg-blue-400/10 text-blue-400"
                      : "bg-[#7c3aed]/10 text-[#7c3aed]"
                  )}>
                    {u.authProvider === "google" ? "G" : "Email"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Announcement + System Health */}
        <div className="space-y-4">
          <AnnouncementToggle
            initialText={stats.announcementText}
            initialVisible={stats.announcementVisible}
          />
          <SystemHealth />
        </div>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts />
    </div>
  );
}
