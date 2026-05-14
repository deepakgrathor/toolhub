"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { legalDisclaimerSchema, type LegalDisclaimerInput } from "./schema";
import { legalDisclaimerConfig } from "./config";
import { AlertCircle, Coins, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface DisclaimerOutput {
  disclaimerText: string;
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

export default function LegalDisclaimerTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? legalDisclaimerConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<DisclaimerOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LegalDisclaimerInput>({
    resolver: zodResolver(legalDisclaimerSchema),
    defaultValues: { disclaimerType: "general-website" },
  });

  const selectedType = watch("disclaimerType");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('legal-disclaimer');
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

  const onSubmit = async (data: LegalDisclaimerInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(legalDisclaimerConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/legal-disclaimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(legalDisclaimerConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as DisclaimerOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output.disclaimerText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "disclaimer.txt";
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
        <button type="button" onClick={() => openPaywall(legalDisclaimerConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating
          ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
          : <><Coins className="h-4 w-4" />Generate Disclaimer — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <AlertCircle className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{legalDisclaimerConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {legalDisclaimerConfig.description}
            </p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="legal-disclaimer"
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
              Business / Website Name <span className="text-destructive">*</span>
            </label>
            <input {...register("businessType")} placeholder="e.g. My Health Blog, FinanceGuru App"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.businessType && <p className="text-xs text-destructive">{errors.businessType.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Website URL <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input {...register("websiteUrl")} placeholder="e.g. www.mywebsite.com"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Disclaimer Type</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "general-website", label: "General Website" },
                { value: "medical-health", label: "Medical / Health" },
                { value: "financial-investment", label: "Financial" },
                { value: "affiliate-marketing", label: "Affiliate" },
                { value: "ai-generated-content", label: "AI Content" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedType === value}
                  onClick={() => setValue("disclaimerType", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Additional Context <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea {...register("additionalInfo")} rows={3}
              placeholder="Any specific details to include in the disclaimer"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Disclaimer will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Writing your disclaimer...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${70 + (i * 7) % 25}%` }} />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1" />
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(output.disclaimerText); toast.success("Disclaimer copied"); }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Copy className="h-3.5 w-3.5" />Copy
              </button>
              <button type="button" onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Download className="h-3.5 w-3.5" />Download .txt
              </button>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {output.disclaimerText}
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
