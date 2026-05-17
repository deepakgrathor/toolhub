"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, ChevronLeft, ChevronRight, ArrowUpDown,
  TrendingUp, TrendingDown, Users, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AdminTransactionRow,
  TransactionPagination,
  TransactionSummary,
  TransactionAnalytics,
} from "@/app/admin/transactions/page";

interface Props {
  initialTransactions: AdminTransactionRow[];
  initialPagination: TransactionPagination;
  initialSummary: TransactionSummary;
  initialAnalytics: TransactionAnalytics;
  initialQuery: Record<string, string>;
}

const TYPE_LABELS: Record<string, string> = {
  welcome_bonus:   "Welcome Bonus",
  referral_bonus:  "Referral Bonus",
  referral_reward: "Referral Reward",
  purchase:        "Purchase",
  credit_purchase: "Credit Purchase",
  use:             "Tool Use",
  refund:          "Refund",
  plan_upgrade:    "Plan Upgrade",
  rollover:        "Rollover",
  manual_admin:    "Manual Admin",
};

const TYPE_COLORS: Record<string, string> = {
  welcome_bonus:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
  referral_bonus:  "bg-purple-500/15 text-purple-400 border-purple-500/20",
  referral_reward: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  purchase:        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  credit_purchase: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  use:             "bg-red-500/15 text-red-400 border-red-500/20",
  refund:          "bg-orange-500/15 text-orange-400 border-orange-500/20",
  plan_upgrade:    "bg-teal-500/15 text-teal-400 border-teal-500/20",
  rollover:        "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  manual_admin:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

const PLAN_COLORS: Record<string, string> = {
  free:       "bg-zinc-500/15 text-zinc-400",
  lite:       "bg-blue-500/15 text-blue-400",
  pro:        "bg-purple-500/15 text-purple-400",
  business:   "bg-orange-500/15 text-orange-400",
  enterprise: "bg-yellow-500/15 text-yellow-400",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function TransactionsTable({
  initialTransactions,
  initialPagination,
  initialSummary,
  initialAnalytics,
  initialQuery,
}: Props) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Controlled filters from URL params
  const [q, setQ]             = useState(initialQuery.q || "");
  const [type, setType]       = useState(initialQuery.type || "");
  const [direction, setDir]   = useState(initialQuery.direction || "");
  const [startDate, setStart] = useState(initialQuery.startDate || "");
  const [endDate, setEnd]     = useState(initialQuery.endDate || "");
  const [sortBy, setSortBy]   = useState(initialQuery.sortBy || "createdAt");
  const [sortOrder, setSortOrder] = useState(initialQuery.sortOrder || "desc");
  const [pageInput, setPageInput] = useState(String(initialPagination.page));

  const pushUrl = useCallback((overrides: Record<string, string>) => {
    const merged = {
      q, type, direction, startDate, endDate, sortBy, sortOrder,
      page: String(initialPagination.page),
      limit: String(initialPagination.limit),
      ...overrides,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && !(k === "page" && v === "1") && !(k === "limit" && v === "50")) {
        sp.set(k, v);
      }
    }
    router.push(`/admin/transactions?${sp.toString()}`);
  }, [q, type, direction, startDate, endDate, sortBy, sortOrder, initialPagination.page, initialPagination.limit, router]);

  function handleSearch(val: string) {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushUrl({ q: val, page: "1" });
    }, 300);
  }

  function handleFilter(key: string, val: string) {
    const updates: Record<string, string> = { [key]: val, page: "1" };
    if (key === "type") setType(val);
    if (key === "direction") setDir(val);
    if (key === "startDate") setStart(val);
    if (key === "endDate") setEnd(val);
    if (key === "sortBy") { setSortBy(val); updates.sortBy = val; }
    if (key === "sortOrder") { setSortOrder(val); updates.sortOrder = val; }
    pushUrl(updates);
  }

  function handleSort(field: string) {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    pushUrl({ sortBy: field, sortOrder: newOrder, page: "1" });
  }

  function handleReset() {
    setQ(""); setType(""); setDir(""); setStart(""); setEnd("");
    setSortBy("createdAt"); setSortOrder("desc"); setPageInput("1");
    router.push("/admin/transactions");
  }

  function goPage(p: number) {
    setPageInput(String(p));
    pushUrl({ page: String(p) });
  }

  function handlePageJump(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const p = Math.max(1, Math.min(initialPagination.totalPages, parseInt(pageInput, 10) || 1));
      goPage(p);
    }
  }

  const { total, page, limit, hasNext, hasPrev } = initialPagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  const hasFilters = !!(q || type || direction || startDate || endDate || sortBy !== "createdAt");

  return (
    <>
      {/* Analytics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Credits Issued"
          value={initialAnalytics.totalCreditsIssued.toLocaleString("en-IN")}
          sub="All time"
          icon={TrendingUp}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="Total Credits Consumed"
          value={initialAnalytics.totalCreditsConsumed.toLocaleString("en-IN")}
          sub="All time"
          icon={TrendingDown}
          accent="bg-red-500/15 text-red-400"
        />
        <StatCard
          label="Active Users"
          value={initialSummary.uniqueUsers.toLocaleString("en-IN")}
          sub="In current view"
          icon={Users}
          accent="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="Transactions Today"
          value={initialAnalytics.todayCount.toLocaleString("en-IN")}
          icon={Zap}
          accent="bg-purple-500/15 text-purple-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={q}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by email or user ID…"
              className="w-full rounded-lg border border-border bg-[#111111] pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
            {q && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {hasFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type */}
          <select
            value={type}
            onChange={(e) => handleFilter("type", e.target.value)}
            className="rounded-lg border border-border bg-[#111111] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>

          {/* Direction */}
          <select
            value={direction}
            onChange={(e) => handleFilter("direction", e.target.value)}
            className="rounded-lg border border-border bg-[#111111] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="">All Directions</option>
            <option value="credit">Credits In (+)</option>
            <option value="debit">Credits Out (−)</option>
          </select>

          {/* Start date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleFilter("startDate", e.target.value)}
            className="rounded-lg border border-border bg-[#111111] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />

          {/* End date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleFilter("endDate", e.target.value)}
            className="rounded-lg border border-border bg-[#111111] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />

          {/* Sort */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(":");
              setSortBy(sb); setSortOrder(so);
              pushUrl({ sortBy: sb, sortOrder: so, page: "1" });
            }}
            className="rounded-lg border border-border bg-[#111111] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="amount:desc">Highest Amount</option>
            <option value="amount:asc">Lowest Amount</option>
            <option value="balanceAfter:desc">Highest Balance</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="min-w-[1100px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#111111]">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-10">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">Type</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-24">
                  <button onClick={() => handleSort("amount")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                    Amount <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-28">
                  <button onClick={() => handleSort("balanceAfter")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                    Balance <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Tool</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">Note</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">
                  <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {initialTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              )}
              {initialTransactions.map((txn, i) => (
                <tr
                  key={txn._id}
                  onClick={() => router.push(`/admin/transactions/${txn._id}`)}
                  className={cn(
                    "border-b border-border last:border-0 cursor-pointer transition-colors",
                    i % 2 === 0 ? "bg-transparent hover:bg-muted/30" : "bg-[#111111]/40 hover:bg-muted/40"
                  )}
                >
                  {/* Row number */}
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {start + i}
                  </td>

                  {/* User */}
                  <td className="px-4 py-3">
                    {txn.user ? (
                      <div>
                        <p className="font-medium text-foreground text-xs leading-tight">{txn.user.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{txn.user.name}</span>
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            PLAN_COLORS[txn.user.plan] ?? "bg-zinc-500/15 text-zinc-400"
                          )}>
                            {txn.user.plan.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">{txn.userId}</span>
                    )}
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                      TYPE_COLORS[txn.type] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
                    )}>
                      {TYPE_LABELS[txn.type] ?? txn.type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className={cn(
                    "px-4 py-3 text-right font-bold tabular-nums text-sm",
                    txn.amount > 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {txn.amount > 0 ? `+${txn.amount}` : txn.amount}
                  </td>

                  {/* Balance after */}
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground tabular-nums">
                    {txn.balanceAfter.toLocaleString("en-IN")}
                  </td>

                  {/* Tool slug */}
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {txn.toolSlug ?? "—"}
                  </td>

                  {/* Note */}
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px]">
                    {txn.note ? (
                      <span title={txn.note} className="truncate block max-w-[160px]">
                        {txn.note.length > 40 ? txn.note.slice(0, 40) + "…" : txn.note}
                      </span>
                    ) : "—"}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(txn.createdAt)}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/admin/transactions/${txn._id}`}
                      className="text-xs font-medium text-[#7c3aed] hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "No transactions"
            : `Showing ${start}–${end} of ${total.toLocaleString("en-IN")} transactions`}
        </p>

        <div className="flex items-center gap-2">
          {/* Per-page */}
          <select
            value={limit}
            onChange={(e) => pushUrl({ limit: e.target.value, page: "1" })}
            className="rounded-lg border border-border bg-[#111111] px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>

          {/* Prev */}
          <button
            disabled={!hasPrev}
            onClick={() => goPage(page - 1)}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page jump */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="number"
              min={1}
              max={initialPagination.totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageJump}
              className="w-12 rounded-lg border border-border bg-[#111111] px-2 py-1 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
            <span>/ {initialPagination.totalPages}</span>
          </div>

          {/* Next */}
          <button
            disabled={!hasNext}
            onClick={() => goPage(page + 1)}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
