"use client";

import Link from "next/link";
import { Activity, Coins, TrendingDown, CalendarDays } from "lucide-react";
import { useCreditStore } from "@/store/credits-store";

interface StatsBarProps {
  toolsUsed: number;
  creditsUsed: number;
  memberSince: string;
}

export function StatsBar({ toolsUsed, creditsUsed, memberSince }: StatsBarProps) {
  const balance = useCreditStore((s) => s.balance);

  const stats = [
    {
      label: "Tools Used",
      value: toolsUsed,
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: undefined,
    },
    {
      label: "Credits Left",
      value: balance,
      icon: Coins,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/pricing",
    },
    {
      label: "Credits Used",
      value: creditsUsed,
      icon: TrendingDown,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      href: undefined,
    },
    {
      label: "Member Since",
      value: memberSince,
      icon: CalendarDays,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: undefined,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg, href }) => {
        const card = (
          <div
            className={`rounded-xl border border-border bg-surface p-4 flex items-center gap-3 transition-colors hover:border-border/80 ${href ? "cursor-pointer" : ""}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground leading-none mb-0.5 truncate">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        );

        return href ? (
          <Link key={label} href={href}>{card}</Link>
        ) : (
          <div key={label}>{card}</div>
        );
      })}
    </div>
  );
}
