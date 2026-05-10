"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Health {
  mongodb: boolean;
  redis: boolean;
  checkedAt: string;
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span className={cn(
      "inline-block h-2 w-2 rounded-full shrink-0",
      ok ? "bg-[#10b981]" : "bg-red-500"
    )} />
  );
}

export function SystemHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/system-health");
      if (r.ok) setHealth(await r.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const services = [
    { label: "MongoDB", key: "mongodb" as const },
    { label: "Redis (Upstash)", key: "redis" as const },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">System Health</h3>
        <button
          onClick={load}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {loading && !health ? (
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="inline-block h-2 w-2 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex items-center gap-1.5">
                <Dot ok={health?.[s.key] ?? false} />
                <span className={cn(
                  "text-xs font-medium",
                  health?.[s.key] ? "text-[#10b981]" : "text-red-400"
                )}>
                  {health?.[s.key] ? "Online" : "Down"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {health?.checkedAt && (
        <p className="text-[10px] text-muted-foreground/50 mt-3">
          Checked {new Date(health.checkedAt).toLocaleTimeString("en-IN")}
        </p>
      )}
    </div>
  );
}
