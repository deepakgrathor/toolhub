"use client";

import { useState } from "react";
import { X, FileDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface BrandAssets {
  logoUrl: string | null;
  signatureUrl: string | null;
  letterheadColor: string;
  signatoryName: string;
  signatoryDesignation: string;
  businessName?: string;
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolSlug: string;
  toolName: string;
  content: string;
  planSlug: string;
  brandAssets: BrandAssets | null;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  toolSlug,
  toolName,
  content,
  planSlug,
  brandAssets,
}: PDFPreviewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const isPro = planSlug !== "free" && planSlug !== "lite";
  const accentColor = brandAssets?.letterheadColor ?? "#7c3aed";
  const previewLines = content.split("\n").slice(0, 30);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/tools/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, toolName, content }),
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
      a.download = `${toolSlug}-output.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <h3 className="font-semibold text-foreground">PDF Preview</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview area — A4-like ratio */}
        <div className="overflow-y-auto flex-1 p-4">
          <div
            className="w-full bg-white shadow-lg rounded-lg overflow-hidden text-[#111]"
            style={{ minHeight: "500px" }}
          >
            {/* PDF Header */}
            <div
              className="flex items-center justify-between px-8 py-4"
              style={{ backgroundColor: isPro ? accentColor : "#7c3aed" }}
            >
              {isPro && brandAssets?.logoUrl ? (
                <img
                  src={brandAssets.logoUrl}
                  alt="Logo"
                  className="h-10 object-contain"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {isPro ? (brandAssets?.businessName ?? "My Business") : "SetuLix"}
                </span>
              )}
              {isPro && brandAssets?.logoUrl && brandAssets.businessName && (
                <span className="text-white font-semibold text-sm">
                  {brandAssets.businessName}
                </span>
              )}
            </div>

            {/* PDF Content area */}
            <div className="px-8 py-6 space-y-4">
              {/* Title */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{toolName}</h2>
                <div
                  className="mt-2 h-0.5 rounded"
                  style={{ backgroundColor: isPro ? accentColor : "#7c3aed" }}
                />
              </div>

              {/* Content preview */}
              <div className="space-y-1">
                {previewLines.map((line, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    {line || " "}
                  </p>
                ))}
                {content.split("\n").length > 30 && (
                  <p className="text-xs text-gray-400 italic">... (content continues in PDF)</p>
                )}
              </div>

              {/* Signature section — PRO only */}
              {isPro && (
                <div
                  className="mt-6 pt-4 border-t border-gray-200"
                >
                  <p className="text-xs text-gray-500 mb-2">Authorized Signatory:</p>
                  {brandAssets?.signatureUrl ? (
                    <div
                      className="mb-2 inline-block"
                      style={{
                        backgroundImage: "repeating-conic-gradient(#d0d0d0 0% 25%, transparent 0% 50%) 0 0/10px 10px",
                      }}
                    >
                      <img
                        src={brandAssets.signatureUrl}
                        alt="Signature"
                        className="h-12 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-28 border-b border-gray-300 mb-2" />
                  )}
                  {brandAssets?.signatoryName && (
                    <p className="text-sm font-semibold text-gray-800">{brandAssets.signatoryName}</p>
                  )}
                  {brandAssets?.signatoryDesignation && (
                    <p className="text-xs text-gray-500">{brandAssets.signatoryDesignation}</p>
                  )}
                </div>
              )}
            </div>

            {/* PDF Footer */}
            <div
              className="flex items-center justify-between px-8 py-3 border-t"
              style={{ borderTopColor: isPro ? accentColor : "#7c3aed" }}
            >
              <p className="text-xs text-gray-400">
                {isPro
                  ? (brandAssets?.businessName ?? "My Business")
                  : "Generated by SetuLix — setulix.com"}
              </p>
              <p className="text-xs text-gray-400">Page 1 of 1</p>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            )}
          >
            {downloading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><FileDown className="h-4 w-4" /> Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
