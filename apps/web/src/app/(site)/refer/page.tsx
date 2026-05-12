"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Gift, Users, CheckCircle, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

type ReferralStatus = "pending" | "completed" | "suspicious";

interface ReferralStats {
  total: number;
  completed: number;
  creditsEarned: number;
}

interface RecentReferral {
  id: string;
  name: string;
  status: ReferralStatus;
  date: string;
}

interface ReferralData {
  refCode: string;
  refLink: string;
  stats: ReferralStats;
  recent: RecentReferral[];
}

const STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: "Pending",
  completed: "Joined",
  suspicious: "Flagged",
};

const STATUS_COLORS: Record<ReferralStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  completed: "bg-green-500/15 text-green-600 dark:text-green-400",
  suspicious: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export default function ReferPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/user/referrals")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleCopy() {
    if (!data?.refLink) return;
    await navigator.clipboard.writeText(data.refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">Refer &amp; Earn</h1>
          <p className="text-sm text-muted-foreground">
            Invite friends. Both of you get 10 credits when they complete onboarding.
          </p>
        </div>
      </div>

      {/* Referral link card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Referral Link
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground font-mono truncate select-all">
            {data?.refLink ?? "—"}
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0",
              copied
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy
              </>
            )}
          </button>
        </div>
        {data?.refCode && (
          <p className="text-xs text-muted-foreground">
            Code: <span className="font-mono font-semibold text-foreground">{data.refCode}</span>
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          label="Total Referrals"
          value={data?.stats.total ?? 0}
        />
        <StatCard
          icon={CheckCircle}
          label="Successful"
          value={data?.stats.completed ?? 0}
        />
        <StatCard
          icon={Coins}
          label="Credits Earned"
          value={data?.stats.creditsEarned ?? 0}
        />
      </div>

      {/* Recent referrals */}
      {(data?.recent?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Recent Referrals</p>
          </div>
          <ul className="divide-y divide-border">
            {data!.recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-foreground">{r.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_COLORS[r.status]
                    )}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(data?.recent?.length ?? 0) === 0 && !loading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Gift className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started!</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
