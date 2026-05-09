"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import { TOOL_NAME_MAP } from "@/lib/tool-names";

interface AnalyticsData {
  activeUsers: number;
  creditsSold: number;
  creditsConsumed: number;
  creditsSeries: { date: string; in: number; out: number }[];
  newUsersSeries: { date: string; count: number }[];
  toolUsage: { slug: string; count: number }[];
}

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const creditSeriesFormatted = data.creditsSeries.map((d) => ({
    ...d,
    date: shortDate(d.date),
  }));
  const newUsersFormatted = data.newUsersSeries.map((d) => ({
    ...d,
    date: shortDate(d.date),
  }));
  const toolUsageFormatted = data.toolUsage.map((t) => ({
    name: TOOL_NAME_MAP[t.slug] ?? t.slug,
    count: t.count,
  }));

  const commonAxis = {
    tick: { fill: "#888", fontSize: 11 },
    axisLine: { stroke: "#27272a" },
    tickLine: false,
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Credits In vs Out — Area chart */}
      <div className="rounded-xl border border-border bg-[#111111] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Credits In vs Out — Last 30 days</h3>
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
            <Tooltip
              contentStyle={{ background: "#1a1a1a", border: "1px solid #27272a", borderRadius: 8 }}
              labelStyle={{ color: "#e8e8e8", fontSize: 11 }}
              itemStyle={{ fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
            <Area type="monotone" dataKey="in" name="Credits In" stroke="#7c3aed" fill="url(#gradIn)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="out" name="Credits Out" stroke="#10b981" fill="url(#gradOut)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 8 tools usage */}
        <div className="rounded-xl border border-border bg-[#111111] p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Tools by Usage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={toolUsageFormatted} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" {...commonAxis} />
              <YAxis type="category" dataKey="name" width={120} {...commonAxis} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #27272a", borderRadius: 8 }}
                labelStyle={{ color: "#e8e8e8", fontSize: 11 }}
                itemStyle={{ fontSize: 11 }}
              />
              <Bar dataKey="count" name="Uses" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* New users per day */}
        <div className="rounded-xl border border-border bg-[#111111] p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">New Users — Last 14 days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={newUsersFormatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" {...commonAxis} />
              <YAxis {...commonAxis} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #27272a", borderRadius: 8 }}
                labelStyle={{ color: "#e8e8e8", fontSize: 11 }}
                itemStyle={{ fontSize: 11 }}
              />
              <Bar dataKey="count" name="New Users" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
