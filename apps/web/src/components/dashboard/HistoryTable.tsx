"use client";

import { useEffect, useState } from "react";
import { Eye, ExternalLink, History } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OutputRecord {
  _id: string;
  toolSlug: string;
  outputText: string;
  creditsUsed: number;
  createdAt: string;
}

interface ApiResponse {
  outputs: OutputRecord[];
  total: number;
  page: number;
  totalPages: number;
}

// Simple slug → display name map
const TOOL_NAMES: Record<string, string> = {
  "blog-generator": "Blog Generator",
  "yt-script": "YT Script",
  "thumbnail-ai": "Thumbnail AI",
  "title-generator": "Title Generator",
  "hook-writer": "Hook Writer",
  "caption-generator": "Caption Generator",
  "gst-invoice": "GST Invoice",
  "expense-tracker": "Expense Tracker",
  "quotation-generator": "Quotation Generator",
  "website-generator": "Website Generator",
  "qr-generator": "QR Generator",
  "whatsapp-bulk": "WhatsApp Bulk",
  "salary-slip": "Salary Slip",
  "resume-screener": "Resume Screener",
  "jd-generator": "JD Generator",
  "offer-letter": "Offer Letter",
  "appraisal-draft": "Appraisal Draft",
  "policy-generator": "Policy Generator",
  "gst-calculator": "GST Calculator",
  "tds-sheet": "TDS Sheet",
  "legal-notice": "Legal Notice",
  "nda-generator": "NDA Generator",
  "legal-disclaimer": "Legal Disclaimer",
  "email-subject": "Email Subject",
  "linkedin-bio": "LinkedIn Bio",
  "seo-auditor": "SEO Auditor",
  "ad-copy": "Ad Copy",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-white/10" />
        </td>
      ))}
    </tr>
  );
}

export function HistoryTable() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOutput, setDialogOutput] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/history?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [page]);

  const outputs = data?.outputs ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Generation History</h2>
        </div>

        {!loading && outputs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <History className="h-10 w-10" />
            <p className="font-medium text-foreground">No history yet</p>
            <p className="text-sm">Use a tool to see your history here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tool</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Credits Used</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : outputs.map((row) => (
                      <tr
                        key={row._id}
                        className="border-b border-border last:border-0 hover:bg-white/3 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {TOOL_NAMES[row.toolSlug] ?? row.toolSlug}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[#7c3aed]/15 px-2 py-0.5 text-xs font-medium text-[#7c3aed]">
                            {row.creditsUsed} cr
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDialogOutput(row.outputText)}
                              className="flex items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                              title="View output"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/tools/${row.toolSlug}`}
                              className="flex items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                              title="Open tool"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors",
                page === 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-surface text-foreground"
              )}
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors",
                page === totalPages
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-surface text-foreground"
              )}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Output viewer dialog */}
      {dialogOutput !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDialogOutput(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-semibold text-foreground">Output</h3>
              <button
                onClick={() => setDialogOutput(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-[var(--font-mono,monospace)]">
                {dialogOutput}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
