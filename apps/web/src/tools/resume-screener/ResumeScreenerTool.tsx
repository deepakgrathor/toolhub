"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resumeScreenerSchema, type ResumeScreenerInput } from "./schema";
import { resumeScreenerConfig } from "./config";
import { FileSearch, Coins, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface ScreenerOutput {
  matchScore: number;
  verdict: "strong-match" | "good-match" | "weak-match" | "no-match";
  keyMatches: string[];
  gaps: string[];
  recommendation: string;
  interviewQuestions: string[];
}

const VERDICT_CONFIG = {
  "strong-match": { label: "Strong Match", color: "text-green-500", bg: "bg-green-500/15" },
  "good-match": { label: "Good Match", color: "text-blue-500", bg: "bg-blue-500/15" },
  "weak-match": { label: "Weak Match", color: "text-amber-500", bg: "bg-amber-500/15" },
  "no-match": { label: "No Match", color: "text-destructive", bg: "bg-destructive/15" },
};

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-amber-500";
  return "text-destructive";
}

export default function ResumeScreenerTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? resumeScreenerConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<ScreenerOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResumeScreenerInput>({
    resolver: zodResolver(resumeScreenerSchema),
  });

  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('resume-screener');
  const defaultLoadedRef = useRef(false);

  useEffect(() => {
    fetch('/api/user/plan')
      .then(r => r.json())
      .then((d: { planSlug?: string }) => setPlanSlug(d.planSlug ?? 'free'))
      .catch(() => null);
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  useEffect(() => {
    if (!isFetched || defaultLoadedRef.current) return;
    const defaultPreset = presets.find(p => p.isDefault);
    if (defaultPreset) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(defaultPreset.inputs).forEach(([key, value]) => setValue(key as any, value as string, { shouldValidate: false }));
      defaultLoadedRef.current = true;
    }
  }, [isFetched, presets, setValue]);

  const onSubmit = async (data: ResumeScreenerInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(resumeScreenerConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/resume-screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(resumeScreenerConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as ScreenerOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Screening failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  function GenerateButton() {
    if (status === "unauthenticated") {
      return (
        <button type="button" onClick={() => openAuthModal("login")}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Login to Screen
        </button>
      );
    }
    if (balance < creditCost) {
      return (
        <button type="button" onClick={() => openPaywall(resumeScreenerConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating
          ? <><Loader2 className="h-4 w-4 animate-spin" />Screening...</>
          : <><Coins className="h-4 w-4" />Screen Resume — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <FileSearch className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{resumeScreenerConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {resumeScreenerConfig.description}
            </p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="resume-screener"
          currentInputs={formValues}
          planSlug={planSlug}
          onPresetLoad={(inputs) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.entries(inputs).forEach(([key, value]) => setValue(key as any, value, { shouldValidate: false }));
            toast.success('Preset loaded!');
          }}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Resume Text <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register("resumeText")}
              rows={10}
              placeholder="Paste the candidate's resume text here..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none font-mono text-xs"
            />
            {errors.resumeText && <p className="text-xs text-destructive">{errors.resumeText.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Job Description <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register("jobDescription")}
              rows={7}
              placeholder="Paste the job description here..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none font-mono text-xs"
            />
            {errors.jobDescription && <p className="text-xs text-destructive">{errors.jobDescription.message}</p>}
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <FileSearch className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Screening report will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Paste resume + JD and click Screen</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Analysing resume against JD...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${60 + (i * 9) % 35}%` }} />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (() => {
          const verdictCfg = VERDICT_CONFIG[output.verdict] ?? VERDICT_CONFIG["weak-match"];
          return (
            <div className="space-y-4">
              {/* Score + Verdict */}
              <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
                <div className="text-center">
                  <p className={`text-5xl font-black ${getScoreColor(output.matchScore)}`}>
                    {output.matchScore}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">/ 100</p>
                </div>
                <div className="flex-1">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${verdictCfg.bg} ${verdictCfg.color}`}>
                    {verdictCfg.label}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed mt-2">{output.recommendation}</p>
                </div>
              </div>

              {/* Key Matches */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Key Matches</p>
                <ul className="space-y-1.5">
                  {output.keyMatches.map((match, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {match}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Gaps</p>
                <ul className="space-y-1.5">
                  {output.gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interview Questions */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Suggested Interview Questions</p>
                <ol className="space-y-2">
                  {output.interviewQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-xs font-mono text-muted-foreground mt-0.5 w-5 shrink-0">{i + 1}.</span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>

              <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
