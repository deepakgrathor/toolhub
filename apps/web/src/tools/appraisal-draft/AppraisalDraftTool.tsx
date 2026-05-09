"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appraisalDraftSchema, type AppraisalDraftInput } from "./schema";
import { appraisalDraftConfig } from "./config";
import { TrendingUp, Coins, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

interface AppraisalOutput {
  summary: string;
  strengthsSection: string;
  improvementSection: string;
  goalsSection: string;
  overallRating: string;
  fullAppraisal: string;
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

function SectionCard({ heading, content, onCopy }: { heading: string; content: string; onCopy: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <Copy className="h-3 w-3" />Copy
        </button>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

export default function AppraisalDraftTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? appraisalDraftConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<AppraisalOutput | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AppraisalDraftInput>({
    resolver: zodResolver(appraisalDraftSchema),
    defaultValues: { rating: "meets", tone: "formal" },
  });

  const selectedRating = watch("rating");
  const selectedTone = watch("tone");

  const onSubmit = async (data: AppraisalDraftInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(appraisalDraftConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/appraisal-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(appraisalDraftConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as AppraisalOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  function downloadTxt() {
    if (!output) return;
    const blob = new Blob([output.fullAppraisal], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "appraisal-draft.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

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
        <button type="button" onClick={() => openPaywall(appraisalDraftConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Coins className="h-4 w-4" />Generate Appraisal — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <TrendingUp className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{appraisalDraftConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{creditCost} credits</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{appraisalDraftConfig.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Employee Name <span className="text-destructive">*</span></label>
              <input {...register("employeeName")} placeholder="e.g. Priya Sharma" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.employeeName && <p className="text-xs text-destructive">{errors.employeeName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Role / Designation <span className="text-destructive">*</span></label>
              <input {...register("role")} placeholder="e.g. Senior Engineer" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Review Period <span className="text-destructive">*</span></label>
              <input {...register("reviewPeriod")} placeholder="e.g. Jan 2025 – Dec 2025" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Manager Name <span className="text-destructive">*</span></label>
              <input {...register("managerName")} placeholder="e.g. Rahul Mehta" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.managerName && <p className="text-xs text-destructive">{errors.managerName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Overall Rating</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "exceptional", label: "Exceptional" },
                { value: "exceeds", label: "Exceeds" },
                { value: "meets", label: "Meets" },
                { value: "below", label: "Below" },
                { value: "unsatisfactory", label: "Unsatisfactory" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedRating === value} onClick={() => setValue("rating", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Key Achievements <span className="text-destructive">*</span></label>
            <textarea {...register("achievements")} rows={4} placeholder="Describe what the employee accomplished this review period..." className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.achievements && <p className="text-xs text-destructive">{errors.achievements.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Areas for Improvement <span className="text-destructive">*</span></label>
            <textarea {...register("areasOfImprovement")} rows={3} placeholder="Describe areas where growth is needed..." className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.areasOfImprovement && <p className="text-xs text-destructive">{errors.areasOfImprovement.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tone</label>
            <div className="flex gap-2">
              {(["formal", "encouraging", "constructive"] as const).map((t) => (
                <Pill key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={selectedTone === t} onClick={() => setValue("tone", t)} />
              ))}
            </div>
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your appraisal will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Drafting your appraisal...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-medium text-muted-foreground">Rating: <span className="text-foreground">{output.overallRating}</span></p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { navigator.clipboard.writeText(output.fullAppraisal); toast.success("Appraisal copied"); }}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Copy className="h-3.5 w-3.5" />Copy Full
                </button>
                <button type="button" onClick={downloadTxt}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Download className="h-3.5 w-3.5" />Download .txt
                </button>
              </div>
            </div>

            <SectionCard
              heading="Overall Summary"
              content={output.summary}
              onCopy={() => { navigator.clipboard.writeText(output.summary); toast.success("Copied"); }}
            />
            <SectionCard
              heading="Key Strengths"
              content={output.strengthsSection}
              onCopy={() => { navigator.clipboard.writeText(output.strengthsSection); toast.success("Copied"); }}
            />
            <SectionCard
              heading="Areas for Growth"
              content={output.improvementSection}
              onCopy={() => { navigator.clipboard.writeText(output.improvementSection); toast.success("Copied"); }}
            />
            <SectionCard
              heading="Goals for Next Period"
              content={output.goalsSection}
              onCopy={() => { navigator.clipboard.writeText(output.goalsSection); toast.success("Copied"); }}
            />

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
