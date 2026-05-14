"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adCopySchema, type AdCopyInput } from "./schema";
import { adCopyConfig } from "./config";
import { BadgeDollarSign, Coins, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface AdVariant {
  variant: string;
  headline: string;
  primaryText: string;
  cta: string;
}

interface AdCopyOutput {
  ads: AdVariant[];
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

function buildAdText(ad: AdVariant): string {
  return `[${ad.variant}]\n\nHeadline: ${ad.headline}\n\nPrimary Text:\n${ad.primaryText}\n\nCTA: ${ad.cta}`;
}

export default function AdCopyTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? adCopyConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<AdCopyOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdCopyInput>({
    resolver: zodResolver(adCopySchema),
    defaultValues: { platform: "facebook", goal: "leads" },
  });

  const selectedPlatform = watch("platform");
  const selectedGoal = watch("goal");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('ad-copy');
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

  const onSubmit = async (data: AdCopyInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(adCopyConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/ad-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(adCopyConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as AdCopyOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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
        <button type="button" onClick={() => openPaywall(adCopyConfig.name, creditCost)}
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
          : <><Coins className="h-4 w-4" />Generate Ad Copy — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <BadgeDollarSign className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{adCopyConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {adCopyConfig.description}
            </p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="ad-copy"
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
              Product / Service Name <span className="text-destructive">*</span>
            </label>
            <input {...register("productName")} placeholder="e.g. FinBook Pro, Sharma Jewellers"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Product Description <span className="text-destructive">*</span>
            </label>
            <textarea {...register("productDescription")} rows={3}
              placeholder="What does your product/service do? What problem does it solve?"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.productDescription && <p className="text-xs text-destructive">{errors.productDescription.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Target Audience <span className="text-destructive">*</span>
            </label>
            <input {...register("targetAudience")} placeholder="e.g. Small business owners in India, 25-45"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.targetAudience && <p className="text-xs text-destructive">{errors.targetAudience.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Unique Selling Point <span className="text-destructive">*</span>
            </label>
            <input {...register("usp")} placeholder="e.g. 30-day free trial, No setup fee, India's #1 rated"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.usp && <p className="text-xs text-destructive">{errors.usp.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Platform</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "facebook", label: "Facebook" },
                { value: "instagram", label: "Instagram" },
                { value: "google", label: "Google" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "twitter", label: "Twitter/X" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedPlatform === value}
                  onClick={() => setValue("platform", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Campaign Goal</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "awareness", label: "Awareness" },
                { value: "leads", label: "Leads" },
                { value: "sales", label: "Sales" },
                { value: "traffic", label: "Traffic" },
                { value: "engagement", label: "Engagement" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedGoal === value}
                  onClick={() => setValue("goal", value)} />
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
            <BadgeDollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">3 ad variations will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Each with different creative approach</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Writing ad copy variations...</p>
            <div className="w-full max-w-md space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5 rounded-lg border border-border p-3">
                  <div className="h-3 rounded bg-muted animate-pulse w-1/3" />
                  <div className="h-4 rounded bg-muted animate-pulse w-4/5" />
                  <div className="h-3 rounded bg-muted animate-pulse w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">3 ad variations</p>

            {output.ads.map((ad, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {ad.variant}
                  </span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(buildAdText(ad)); toast.success("Ad copied"); }}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Copy className="h-3 w-3" />Copy ad
                  </button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Headline</p>
                  <p className="text-base font-bold text-foreground leading-snug">{ad.headline}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Primary Text</p>
                  <p className="text-sm text-foreground leading-relaxed">{ad.primaryText}</p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground font-medium">CTA:</p>
                  <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
                    {ad.cta}
                  </span>
                </div>
              </div>
            ))}

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
