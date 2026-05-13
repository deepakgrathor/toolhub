"use client";

import { useState, useEffect, useCallback } from "react";
import { IndianRupee, TrendingUp, Receipt, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentRow {
  _id: string;
  orderId: string;
  userName: string;
  userEmail: string;
  type: "credit_pack" | "plan";
  amount: number;
  status: "created" | "paid" | "failed" | "cancelled";
  invoiceNumber: string | null;
  paymentMethod: string | null;
  cashfreePaymentId: string | null;
  billingSnapshot: {
    accountType: string;
    fullName: string;
    businessName: string;
    gstin: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  credits: number;
  planSlug: string | null;
  billingCycle: string | null;
  createdAt: string;
}

interface Stats {
  totalRevenue: number;
  todayRevenue: number;
  totalTransactions: number;
  successRate: number;
}

interface ApiResponse {
  payments: PaymentRow[];
  totalCount: number;
  stats: Stats;
}

const STATUS_FILTERS = ["all", "paid", "failed", "created", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function StatusBadge({ status }: { status: PaymentRow["status"] }) {
  const map: Record<PaymentRow["status"], string> = {
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    created: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    cancelled: "bg-muted/50 text-muted-foreground border-border",
  };
  const label: Record<PaymentRow["status"], string> = {
    paid: "Paid",
    failed: "Failed",
    created: "Pending",
    cancelled: "Cancelled",
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", map[status])}>
      {label[status]}
    </span>
  );
}

function TypeBadge({ type }: { type: PaymentRow["type"] }) {
  return type === "credit_pack" ? (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
      Credit Pack
    </span>
  ) : (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-600 border-violet-500/20 font-medium">
      Plan
    </span>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string; icon: React.ElementType; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?status=${statusFilter}&page=${page}`);
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const stats = data?.stats;
  const totalPages = data ? Math.ceil(data.totalCount / 20) : 1;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Payments</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : "—"}
          icon={IndianRupee}
          sub="All time"
        />
        <StatCard
          label="Today's Revenue"
          value={stats ? formatCurrency(stats.todayRevenue) : "—"}
          icon={TrendingUp}
          sub="Today"
        />
        <StatCard
          label="Transactions"
          value={stats ? String(stats.totalTransactions) : "—"}
          icon={Receipt}
          sub="Total orders"
        />
        <StatCard
          label="Success Rate"
          value={stats ? `${stats.successRate}%` : "—"}
          icon={CheckCircle2}
          sub="Paid / total"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setPage(1); }}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              statusFilter === f
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "created" ? "Pending" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Order ID</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted/40 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No payments found.
                </td>
              </tr>
            ) : (
              data?.payments.map((p) => (
                <>
                  <tr key={p._id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.orderId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-sm">{p.userName}</p>
                      <p className="text-xs text-muted-foreground">{p.userEmail}</p>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      {p.invoiceNumber ? (
                        <span className="font-mono text-xs text-foreground cursor-pointer hover:text-violet-600"
                          onClick={() => navigator.clipboard.writeText(p.invoiceNumber!)}
                          title="Click to copy">
                          {p.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        Details
                        {expandedRow === p._id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === p._id && (
                    <tr key={`${p._id}-detail`} className="border-t border-border bg-muted/10">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Billing</p>
                            <p className="text-foreground">{p.billingSnapshot.fullName || p.billingSnapshot.businessName}</p>
                            <p className="text-muted-foreground text-xs">{p.billingSnapshot.address}, {p.billingSnapshot.city}</p>
                            <p className="text-muted-foreground text-xs">{p.billingSnapshot.state} — {p.billingSnapshot.pincode}</p>
                            {p.billingSnapshot.gstin && <p className="font-mono text-xs text-muted-foreground mt-1">GSTIN: {p.billingSnapshot.gstin}</p>}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Payment</p>
                            {p.cashfreePaymentId && <p className="text-xs font-mono text-foreground">CF ID: {p.cashfreePaymentId}</p>}
                            {p.paymentMethod && <p className="text-xs text-muted-foreground capitalize">Method: {p.paymentMethod}</p>}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Credits / Plan</p>
                            {p.type === "credit_pack" ? (
                              <p className="text-foreground">{p.credits} credits added</p>
                            ) : (
                              <p className="text-foreground capitalize">{p.planSlug} — {p.billingCycle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} &bull; {data?.totalCount ?? 0} total
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-border text-foreground disabled:opacity-40 hover:bg-muted/50 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-border text-foreground disabled:opacity-40 hover:bg-muted/50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
