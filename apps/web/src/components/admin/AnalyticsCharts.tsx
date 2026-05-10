"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOL_NAME_MAP } from "@/lib/tool-names";

type Days = 7 | 14 | 30 | 90;

interface AnalyticsData {
  days: number;
  activeUsers: number;
  creditsSold: number;
  creditsConsumed: number;
  creditsSeries: { date: string; in: number; out: number }[];
  newUsersSeries: { date: string; count: number }[];
  toolUsage: { slug: string; count: number }[];
  toolCredits: { slug: string; credits: number }[];
}

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

const DAY_TABS: { label: string; value: Days }[] = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

const commonAxis = {
  tick: { fill: "#888", fontSize: 11 },
  axisLine: { stroke: "#27272a" },
  tickLine: false,
};

const tooltipStyle = {
  contentStyle: { background: "#1a1a1a", border: "1px solid #27272a", borderRadius: 8 },
  labelStyle: { color: "#e8e8e8", fontSize: 11 },
  itemStyle: { fontSize: 11 },
};

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<Days>(30);

  const load = useCallback(async (d: Days, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const r = await fetch(`/api/admin/analytics?days=${d}`);
      if (r.ok) setData(await r.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  function switchDays(d: Days) {
    setDays(d);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const creditSeriesFormatted = data.creditsSeries.map((d) => ({ ...d, date: shortDate(d.date) }));
  const newUsersFormatted = data.newUsersSeries.map((d) => ({ ...d, date: shortDate(d.date) }));
  const toolUsageFormatted = data.toolUsage.map((t) => ({
    name: TOOL_NAME_MAP[t.slug] ?? t.slug,
    count: t.count,
  }));

  // Merge toolUsage + toolCredits into a performance table
  const creditMap = new Map(data.toolCredits.map((t) => [t.slug, t.credits]));
  const toolPerformance = data.toolUsage
    .map((t) => ({
      slug: t.slug,
      name: TOOL_NAME_MAP[t.slug] ?? t.slug,
      uses: t.count,
      credits: creditMap.get(t.slug) ?? 0,
      avg: t.count > 0 ? Math.round((creditMap.get(t.slug) ?? 0) / t.count) : 0,
    }))
    .sort((a, b) => b.credits - a.credits);

  return (
    <div className="space-y-6 mt-8">
      {/* Date range tabs + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          {DAY_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => switchDays(value)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                days === value
                  ? "bg-[#7c3aed] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => load(days, true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Credits In vs Out — Area chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Credits In vs Out — Last {days} days
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={creditSeriesFormatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" {...commonAxis} />
            <YAxis {...commonAxis} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
            <Area type="monotone" dataKey="in" name="Credits In" stroke="#7c3aed" fill="url(#gradIn)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="out" name="Credits Out" stroke="#10b981" fill="url(#gradOut)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top tools by usage */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Tools by Usage</h3>
          {toolUsageFormatted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No tool usage yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={toolUsageFormatted} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" {...commonAxis} />
                <YAxis type="category" dataKey="name" width={120} {...commonAxis} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Uses" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* New users per day */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">New Users — Last 14 days</h3>
          {newUsersFormatted.every((d) => d.count === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No new signups in this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newUsersFormatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" {...commonAxis} />
                <YAxis {...commonAxis} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="New Users" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tool Performance Table */}
      {toolPerformance.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Tool Performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">All-time usage and credit consumption per tool</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Tool</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Uses</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Credits Consumed</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Avg / Use</th>
                </tr>
              </thead>
              <tbody>
                {toolPerformance.map((t, i) => (
                  <tr key={t.slug} className={cn(
                    "border-b border-border last:border-0",
                    i % 2 === 1 && "bg-muted/20"
                  )}>
                    <td className="px-5 py-3 font-medium text-foreground text-xs">{t.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs text-muted-foreground">{t.uses.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs text-[#7c3aed] font-medium">{t.credits.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs text-muted-foreground">{t.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
