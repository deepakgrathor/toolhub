"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ReferralStatus = "pending" | "completed" | "suspicious";

interface AdminReferral {
  _id: string;
  referrerId: { name: string; email: string } | null;
  referredId: { name: string; email: string } | null;
  status: ReferralStatus;
  createdAt: string;
  completedAt?: string | null;
  refCode: string;
}

interface ApiResponse {
  referrals: AdminReferral[];
  total: number;
  page: number;
  pages: number;
}

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Suspicious", value: "suspicious" },
];

const STATUS_BADGE: Record<ReferralStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  completed: "bg-green-500/15 text-green-600 dark:text-green-400",
  suspicious: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
};

export default function AdminReferralsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals?status=${filter}&page=${page}`);
      const json = await res.json() as ApiResponse;
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id + action);
    try {
      await fetch(`/api/admin/referrals/${id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-[#7c3aed]" />
        <div>
          <h1 className="text-lg font-semibold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground">
            Manage referrals, approve suspicious ones, or reject bad actors.
          </p>
        </div>
        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.total} total
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setFilter(opt.value); setPage(1); }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Referrer</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Referred User</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && data?.referrals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No referrals found.
                </td>
              </tr>
            )}
            {!loading &&
              data?.referrals.map((r) => (
                <tr
                  key={r._id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors hover:bg-muted/20",
                    r.status === "suspicious" && "bg-amber-500/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {r.referrerId?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.referrerId?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {r.referredId?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.referredId?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_BADGE[r.status]
                      )}
                    >
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {r.status !== "completed" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(r._id, "approve")}
                          disabled={actionLoading === r._id + "approve"}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(r._id, "reject")}
                          disabled={actionLoading === r._id + "reject"}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                    {r.status === "completed" && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
