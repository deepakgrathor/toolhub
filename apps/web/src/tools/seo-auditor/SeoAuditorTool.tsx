"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seoAuditorSchema, type SeoAuditorInput } from "./schema";
import { seoAuditorConfig } from "./config";
import { BarChart2, Coins, Loader2, Info, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

interface SeoCategory {
  name: string;
  score: number;
  status: "good" | "warning" | "poor";
  issues: string[];
  recommendations: string[];
}

interface SeoOutput {
  overallScore: number;
  categories: SeoCategory[];
  quickWins: string[];
  priorityActions: string[];
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Good" : score >= 40 ? "Needs Work" : "Poor";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4"
        style={{ borderColor: color }}
      >
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
      </div>
      <p className="text-xs text-muted-foreground font-medium">SEO Health Score</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SeoCategory["status"] }) {
  if (status === "good") return <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Good</span>;
  if (status === "warning") return <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">Warning</span>;
  return <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Poor</span>;
}

function ScoreBar({ score, status }: { score: number; status: SeoCategory["status"] }) {
  const color = status === "good" ? "bg-success" : status === "warning" ? "bg-yellow-500" : "bg-destructive";
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function SeoAuditorTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? seoAuditorConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<SeoOutput | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SeoAuditorInput>({
    resolver: zodResolver(seoAuditorSchema),
  });

  const onSubmit = async (data: SeoAuditorInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(seoAuditorConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/seo-auditor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(seoAuditorConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as SeoOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Audit failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  function GenerateButton() {
    if (status === "unauthenticated") {
      return (
        <button type="button" onClick={() => openAuthModal("login")}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Login to Audit
        </button>
      );
    }
    if (balance < creditCost) {
      return (
        <button type="button" onClick={() => openPaywall(seoAuditorConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Auditing...</> : <><Coins className="h-4 w-4" />Audit Website — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <BarChart2 className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{seoAuditorConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{creditCost} credits</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{seoAuditorConfig.description}</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex gap-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300 leading-relaxed">
            This provides AI-powered SEO recommendations based on best practices. For a full technical audit, also use Google Search Console.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Website URL <span className="text-destructive">*</span></label>
            <input {...register("websiteUrl")} placeholder="https://yourwebsite.com" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Business Type <span className="text-destructive">*</span></label>
            <input {...register("businessType")} placeholder="e.g. E-commerce, CA Firm, Restaurant" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.businessType && <p className="text-xs text-destructive">{errors.businessType.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Target Keywords <span className="text-destructive">*</span></label>
            <textarea {...register("targetKeywords")} rows={3} placeholder="CA firm Mumbai, tax consultant, GST filing services..." className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.targetKeywords && <p className="text-xs text-destructive">{errors.targetKeywords.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Competitor URLs <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input {...register("competitors")} placeholder="competitor1.com, competitor2.com" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <BarChart2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your SEO audit will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Enter your website details and click Audit</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Analysing your website...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-5">
            {/* Score */}
            <div className="flex justify-center pt-2">
              <ScoreCircle score={output.overallScore} />
            </div>

            {/* Categories grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.isArray(output.categories) && output.categories.map((cat) => (
                <div key={cat.name} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                    <StatusBadge status={cat.status} />
                  </div>
                  <ScoreBar score={cat.score} status={cat.status} />
                  <p className="text-xs text-muted-foreground">{cat.score}/100</p>

                  {Array.isArray(cat.issues) && cat.issues.length > 0 && (
                    <div className="space-y-1">
                      {cat.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground leading-relaxed">{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {Array.isArray(cat.recommendations) && cat.recommendations.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {cat.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />
                          <span className="text-xs text-foreground leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Wins */}
            {Array.isArray(output.quickWins) && output.quickWins.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />Quick Wins
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {output.quickWins.map((win, i) => (
                    <div key={i} className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs text-foreground leading-relaxed">
                      {win}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Actions */}
            {Array.isArray(output.priorityActions) && output.priorityActions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />Priority Actions
                </h3>
                <div className="space-y-1.5">
                  {output.priorityActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
