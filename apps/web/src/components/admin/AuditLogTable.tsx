"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  _id: string;
  action: string;
  target: string;
  after: unknown;
  admin: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  update_tool_config: "Tool Config Update",
  ban_user: "User Banned",
  unban_user: "User Unbanned",
  admin_add_credits: "Credits Added",
  update_pricing: "Pricing Updated",
  update_site_settings: "Settings Updated",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function actionColor(action: string) {
  if (action.includes("ban")) return "text-red-400 bg-red-400/10 border-red-400/20";
  if (action.includes("credits")) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  if (action.includes("tool")) return "text-[#7c3aed] bg-[#7c3aed]/10 border-[#7c3aed]/20";
  return "text-muted-foreground bg-muted/30 border-border";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  function exportCSV() {
    const headers = ["Time", "Action", "Admin", "Target", "Details"];
    const rows = logs.map((l) => [
      formatDate(l.createdAt),
      l.action,
      l.admin,
      l.target,
      JSON.stringify(l.after ?? ""),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `audit-log-page${page}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{total} total entries</p>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/5 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#111111]">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Time</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Action</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Admin</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Target</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No audit entries yet.</td>
                </tr>
              )}
              {logs.map((log, i) => (
                <tr
                  key={log._id}
                  className={cn(
                    "border-b border-border last:border-0",
                    i % 2 === 0 ? "bg-transparent" : "bg-[#111111]/40"
                  )}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      actionColor(log.action)
                    )}>
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">{log.admin}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.target}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                    {log.after ? JSON.stringify(log.after).slice(0, 80) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(page - 1)} disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-white/5 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
