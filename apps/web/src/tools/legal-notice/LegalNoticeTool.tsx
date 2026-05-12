"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { legalNoticeSchema, type LegalNoticeInput } from "./schema";
import { legalNoticeConfig } from "./config";
import { Gavel, Coins, Loader2, Copy, Download, AlertTriangle } from "lucide-react";
import { SmartInput } from "@/components/ui/SmartInput";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

interface LegalNoticeOutput {
  subject: string;
  noticeText: string;
  summary: string;
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

export default function LegalNoticeTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? legalNoticeConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<LegalNoticeOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<LegalNoticeInput>({
    resolver: zodResolver(legalNoticeSchema),
    defaultValues: { noticeType: "payment-recovery", deadlineDays: "15" },
  });

  const selectedType = watch("noticeType");
  const selectedDays = watch("deadlineDays");

  const onSubmit = async (data: LegalNoticeInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(legalNoticeConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/legal-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(legalNoticeConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as LegalNoticeOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const text = `${output.subject}\n\n${output.noticeText}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "legal-notice.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  function GenerateButton() {
    if (status === "unauthenticated") {
      return (
        <button type="button" onClick={() => openAuthModal("login")}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Login to Generate
        </button>
      );
    }
    if (balance < creditCost) {
      return (
        <button type="button" onClick={() => openPaywall(legalNoticeConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating
          ? <><Loader2 className="h-4 w-4 animate-spin" />Drafting Notice...</>
          : <><Coins className="h-4 w-4" />Generate Legal Notice — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Gavel className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{legalNoticeConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {legalNoticeConfig.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Sender */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Sender (Your Details)</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
              <Controller
                name="senderName"
                control={control}
                render={({ field }) => (
                  <SmartInput field="businessName" value={field.value || ""} onChange={field.onChange}
                    placeholder="Your full name or company name"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
                )}
              />
              {errors.senderName && <p className="text-xs text-destructive">{errors.senderName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Address <span className="text-destructive">*</span></label>
              <Controller
                name="senderAddress"
                control={control}
                render={({ field }) => (
                  <SmartInput field="address" value={field.value || ""} onChange={field.onChange}
                    placeholder="Complete address"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
                )}
              />
              {errors.senderAddress && <p className="text-xs text-destructive">{errors.senderAddress.message}</p>}
            </div>
          </div>

          {/* Receiver */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Receiver (Opposite Party)</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
              <input {...register("receiverName")} placeholder="Receiver's full name or company name"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.receiverName && <p className="text-xs text-destructive">{errors.receiverName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Address <span className="text-destructive">*</span></label>
              <textarea {...register("receiverAddress")} rows={2} placeholder="Complete address"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
              {errors.receiverAddress && <p className="text-xs text-destructive">{errors.receiverAddress.message}</p>}
            </div>
          </div>

          {/* Notice Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notice Type</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "payment-recovery", label: "Payment Recovery" },
                { value: "property-dispute", label: "Property Dispute" },
                { value: "service-deficiency", label: "Service Deficiency" },
                { value: "cheque-bounce", label: "Cheque Bounce" },
                { value: "employment", label: "Employment" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedType === value}
                  onClick={() => setValue("noticeType", value)} />
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Subject <span className="text-destructive">*</span></label>
            <input {...register("subject")} placeholder="e.g. Recovery of outstanding payment of ₹50,000"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          {/* Incident Details */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Incident Details <span className="text-destructive">*</span></label>
            <textarea {...register("incidentDetails")} rows={4}
              placeholder="Describe what happened — dates, amounts, agreements, and any communications that took place"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.incidentDetails && <p className="text-xs text-destructive">{errors.incidentDetails.message}</p>}
          </div>

          {/* Demand */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Your Demand <span className="text-destructive">*</span></label>
            <textarea {...register("demand")} rows={2}
              placeholder="e.g. Payment of ₹50,000 with 18% interest, or cessation of illegal activities"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.demand && <p className="text-xs text-destructive">{errors.demand.message}</p>}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Response Deadline</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "7", label: "7 days" },
                { value: "15", label: "15 days" },
                { value: "30", label: "30 days" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedDays === value}
                  onClick={() => setValue("deadlineDays", value)} />
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              AI-generated. Review with a lawyer before sending.
            </p>
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Gavel className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Legal notice will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in all details and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Drafting your legal notice...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${65 + (i * 6) % 30}%` }} />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1" />
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(`${output.subject}\n\n${output.noticeText}`); toast.success("Notice copied"); }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Copy className="h-3.5 w-3.5" />Copy
              </button>
              <button type="button" onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Download className="h-3.5 w-3.5" />Download .txt
              </button>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Subject</p>
              <p className="text-sm font-semibold text-foreground">{output.subject}</p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono text-xs">
                {output.noticeText}
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Summary</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{output.summary}</p>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This is AI-generated content for reference only. Consult a qualified lawyer before sending.
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
