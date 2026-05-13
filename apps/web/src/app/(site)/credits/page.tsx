"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Coins, Plus, Minus, ShoppingBag, ArrowUpRight,
  TrendingDown, Calendar, Hash, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  toolSlug?: string;
  toolName?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

interface Summary {
  balance: number;
  earned: number;
  spent: number;
  thisMonth: number;
  transactionCount: number;
}

interface LedgerResponse {
  transactions: Transaction[];
  totalCount: number;
  totalPages: number;
  page: number;
  summary: Summary;
}

// ── Badge config ──────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  welcome_bonus: { label: "Welcome", cls: "bg-primary/15 text-primary" },
  referral_bonus: { label: "Referral", cls: "bg-green-500/15 text-green-500" },
  referral_reward: { label: "Referral", cls: "bg-green-500/15 text-green-500" },
  use: { label: "Tool Used", cls: "bg-blue-500/15 text-blue-500" },
  purchase: { label: "Purchase", cls: "bg-teal-500/15 text-teal-500" },
  credit_purchase: { label: "Purchase", cls: "bg-teal-500/15 text-teal-500" },
  plan_upgrade: { label: "Plan Upgrade", cls: "bg-orange-500/15 text-orange-500" },
  manual_admin: { label: "Admin", cls: "bg-muted text-muted-foreground" },
  refund: { label: "Refund", cls: "bg-green-500/15 text-green-500" },
};

function typeBadge(type: string) {
  return TYPE_BADGE[type] ?? { label: type, cls: "bg-muted text-muted-foreground" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDescription(tx: Transaction): string {
  if (tx.toolName) return tx.toolName;
  if (tx.note) return tx.note;
  if (tx.meta?.packName) return String(tx.meta.packName);
  if (tx.meta?.planName) return String(tx.meta.planName);
  const { label } = typeBadge(tx.type);
  return label;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, cls }: {
  label: string; value: string | number; icon: React.ElementType; cls?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={cn("rounded-lg p-2", cls ?? "bg-primary/10")}>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CreditsPage() {
  const [filter, setFilter] = useState<"all" | "earned" | "spent">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/credits/ledger?filter=${f}&page=${p}`);
      const json = await res.json() as LedgerResponse;
      setData(json);
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(filter, page);
  }, [filter, page, load]);

  function changeFilter(f: typeof filter) {
    setFilter(f);
    setPage(1);
  }

  const summary = data?.summary;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Credits</h1>
        <div className="flex gap-2">
          <Link
            href="/checkout?type=pack"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="h-4 w-4" /> Buy Credits
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" /> Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-6">
        <div className="rounded-full bg-primary/10 p-4">
          <Coins className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-4xl font-bold text-foreground">
            {loading ? "—" : (summary?.balance ?? 0)}
            <span className="text-lg text-muted-foreground font-normal ml-1">credits</span>
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Earned" value={loading ? "—" : `+${summary?.earned ?? 0}`} icon={Plus} cls="bg-green-500/10" />
        <StatCard label="Total Spent" value={loading ? "—" : `-${summary?.spent ?? 0}`} icon={Minus} cls="bg-red-500/10" />
        <StatCard label="This Month" value={loading ? "—" : `-${summary?.thisMonth ?? 0}`} icon={Calendar} cls="bg-orange-500/10" />
        <StatCard label="Transactions" value={loading ? "—" : (summary?.transactionCount ?? 0)} icon={Hash} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/40 p-1 w-fit">
        {(["all", "earned", "spent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize",
              filter === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transaction table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-[1fr_2fr_100px_120px_160px] gap-4 px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Balance After</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</p>
        </div>

        {loading && (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border animate-pulse bg-muted/20" />
            ))}
          </div>
        )}

        {!loading && (!data?.transactions || data.transactions.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Coins className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60">Start using AI tools to see your credit history</p>
          </div>
        )}

        {!loading && data?.transactions.map((tx, i) => {
          const badge = typeBadge(tx.type);
          const isCredit = tx.amount > 0;

          return (
            <div
              key={tx._id}
              className={cn(
                "grid grid-cols-1 md:grid-cols-[1fr_2fr_100px_120px_160px] gap-2 md:gap-4 px-4 py-3 border-b border-border hover:bg-muted/20 transition-colors",
                i === (data.transactions.length - 1) && "border-b-0"
              )}
            >
              {/* Type badge */}
              <div className="flex items-center">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", badge.cls)}>
                  {badge.label}
                </span>
              </div>

              {/* Description */}
              <div className="flex items-center">
                <p className="text-sm text-foreground truncate">{getDescription(tx)}</p>
              </div>

              {/* Amount */}
              <div className="flex items-center md:justify-end gap-1">
                {isCredit
                  ? <Plus className="h-3.5 w-3.5 text-green-500" />
                  : <Minus className="h-3.5 w-3.5 text-red-500" />}
                <span className={cn("text-sm font-semibold", isCredit ? "text-green-500" : "text-red-500")}>
                  {Math.abs(tx.amount)} cr
                </span>
              </div>

              {/* Balance after */}
              <div className="flex items-center md:justify-end">
                <span className="text-sm text-muted-foreground">{tx.balanceAfter} cr</span>
              </div>

              {/* Date */}
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {data && data.page < data.totalPages && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronDown className="h-4 w-4" /> Load More
          </button>
        </div>
      )}

      {/* Spent/earned summary bottom */}
      {!loading && data && (
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            Showing {data.transactions.length} of {data.totalCount} transactions
          </span>
        </div>
      )}
    </div>
  );
}
