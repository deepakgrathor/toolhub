"use client";

import { useEffect, useState } from "react";
import { Eye, ExternalLink, History, Copy, X, Clock, TrendingUp, FileDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OutputRecord {
  _id: string;
  toolSlug: string;
  toolName?: string;
  outputText: string;
  outputPreview: string;
  creditsUsed: number;
  createdAt: string;
}

interface ApiResponse {
  outputs: OutputRecord[];
  total: number;
  page: number;
  totalPages: number;
  planLimit: number;
  upgradeRequired: boolean;
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
  const [dialogRecord, setDialogRecord] = useState<OutputRecord | null>(null);
  const [planSlug, setPlanSlug] = useState("free");
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d: { planSlug?: string }) => setPlanSlug(d.planSlug ?? "free"))
      .catch(() => null);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/history?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [page]);

  async function handlePDFDownload(record: OutputRecord) {
    setPdfDownloading(true);
    try {
      const toolName = record.toolName ?? TOOL_NAMES[record.toolSlug] ?? record.toolSlug;
      const res = await fetch("/api/tools/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug: record.toolSlug, toolName, content: record.outputText }),
      });

      if (res.status === 403) {
        toast.error("PDF download requires LITE plan. Upgrade to download.");
        return;
      }

      if (!res.ok) throw new Error("Failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${record.toolSlug}-output.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setPdfDownloading(false);
    }
  }

  const outputs = data?.outputs ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (!loading && data?.upgradeRequired) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <div className="flex justify-center">
          <Clock className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">History is a LITE plan feature</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Upgrade to save and revisit all your AI generations.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <TrendingUp className="h-4 w-4" />
          Upgrade to LITE
        </a>
        <p className="text-xs text-muted-foreground mt-2">
          On FREE plan, outputs are not saved. Copy your results before leaving the page.
        </p>
      </div>
    );
  }

  return (
    <>
      {!loading && data && !data.upgradeRequired && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">
            Showing last {data.planLimit} days
          </span>
        </div>
      )}
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tool Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Output Preview</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Credits</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date & Time</th>
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
                        <td className="px-4 py-3 text-foreground text-sm font-medium">
                          {row.toolName ?? TOOL_NAMES[row.toolSlug] ?? row.toolSlug}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell max-w-[200px]">
                          <span className="truncate block">{row.outputPreview || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[#7c3aed]/15 px-2 py-0.5 text-xs font-medium text-[#7c3aed]">
                            {row.creditsUsed} cr
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs hidden md:table-cell">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDialogRecord(row)}
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
      {dialogRecord !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDialogRecord(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-xl border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-semibold text-foreground">
                {dialogRecord.toolName ?? TOOL_NAMES[dialogRecord.toolSlug] ?? dialogRecord.toolSlug}
              </h3>
              <button
                onClick={() => setDialogRecord(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {dialogRecord.toolSlug === "thumbnail-ai" ? (
                <img
                  src={dialogRecord.outputText}
                  alt="Generated thumbnail"
                  className="w-full rounded-lg"
                />
              ) : dialogRecord.toolSlug === "website-generator" ||
                dialogRecord.outputText.trimStart().startsWith("<!DOCTYPE") ||
                dialogRecord.outputText.trimStart().startsWith("<html") ? (
                <div className="space-y-3">
                  <iframe
                    srcDoc={dialogRecord.outputText}
                    className="w-full h-96 rounded-lg border border-border"
                    sandbox="allow-same-origin"
                  />
                  <button
                    onClick={() => {
                      const blob = new Blob([dialogRecord.outputText], { type: "text/html" });
                      window.open(URL.createObjectURL(blob));
                    }}
                    className="text-xs text-[#7c3aed] hover:underline"
                  >
                    Open in new tab
                  </button>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                  {dialogRecord.outputText || <span className="text-muted-foreground italic">No output saved for this generation.</span>}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3">
              <button
                onClick={() => handlePDFDownload(dialogRecord)}
                disabled={pdfDownloading || !dialogRecord.outputText}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
              >
                {pdfDownloading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                ) : (
                  <><FileDown className="h-3.5 w-3.5" /> Download PDF</>
                )}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dialogRecord.outputText);
                  toast.success("Copied to clipboard");
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
