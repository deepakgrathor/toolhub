"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, ExternalLink } from "lucide-react";
import { getToolIcon } from "@/lib/tool-icons";

interface HistoryItem {
  _id: string;
  toolSlug: string;
  toolName: string;
  createdAt: string;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/50 ${className}`} />;
}

export function RecentActivity() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/history?page=1&limit=5")
      .then((r) => r.json())
      .then((data) => setItems(data.outputs ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        </div>
        <Link
          href="/dashboard/history"
          className="text-xs text-primary hover:underline font-medium"
        >
          View All
        </Link>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <History className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60">Use a tool to see your history here</p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = getToolIcon(item.toolSlug);
            const ago = (() => {
              try {
                const diff = Date.now() - new Date(item.createdAt).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return "just now";
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
              } catch {
                return "";
              }
            })();

            return (
              <div key={item._id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.toolName}
                  </p>
                  <p className="text-xs text-muted-foreground">{ago}</p>
                </div>
                <Link
                  href={`/tools/${item.toolSlug}`}
                  className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
