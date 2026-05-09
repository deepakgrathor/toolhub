"use client";

import Link from "next/link";
import { Activity, Coins, TrendingDown, CalendarDays } from "lucide-react";
import { useCreditStore } from "@/store/credits-store";
import { useCountUp } from "@/hooks/useCountUp";

interface StatsBarProps {
  toolsUsed: number;
  creditsUsed: number;
  memberSince: string;
}

function StatValue({ value }: { value: number | string }) {
  const num = typeof value === "number" ? value : NaN;
  const animated = useCountUp(isNaN(num) ? 0 : num);
  if (isNaN(num)) return <>{value}</>;
  return <>{animated}</>;
}

export function StatsBar({ toolsUsed, creditsUsed, memberSince }: StatsBarProps) {
  const balance = useCreditStore((s) => s.balance);

  const stats = [
    {
      label: "Tools Used",
      value: toolsUsed,
      icon: Activity,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      borderColor: "border-l-blue-500",
      href: undefined,
    },
    {
      label: "Credits Left",
      value: balance,
      icon: Coins,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      borderColor: "border-l-primary",
      href: "/pricing",
    },
    {
      label: "Credits Used",
      value: creditsUsed,
      icon: TrendingDown,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      borderColor: "border-l-orange-500",
      href: undefined,
    },
    {
      label: "Member Since",
      value: memberSince,
      icon: CalendarDays,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      borderColor: "border-l-emerald-500",
      href: undefined,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, iconColor, iconBg, borderColor, href }) => {
        const card = (
          <div
            className={`tool-card rounded-xl border border-border border-l-4 ${borderColor} bg-surface p-4 flex items-center gap-3 transition-all duration-150 hover:shadow-sm hover:border-border/80 ${href ? "cursor-pointer" : ""}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} shrink-0`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-bold text-foreground leading-none mb-1 truncate">
                <StatValue value={value} />
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
