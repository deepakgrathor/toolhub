"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ndaGeneratorSchema, type NdaGeneratorInput } from "./schema";
import { ndaGeneratorConfig } from "./config";
import { Lock, Coins, Loader2, Copy, Download, AlertTriangle } from "lucide-react";
import { SmartInput } from "@/components/ui/SmartInput";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface NdaOutput {
  ndaText: string;
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

export default function NdaGeneratorTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? ndaGeneratorConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<NdaOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<NdaGeneratorInput>({
    resolver: zodResolver(ndaGeneratorSchema),
    defaultValues: { ndaType: "one-way", durationMonths: "12" },
  });

  const selectedType = watch("ndaType");
  const selectedDuration = watch("durationMonths");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('nda-generator');
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

  const onSubmit = async (data: NdaGeneratorInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(ndaGeneratorConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/nda-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(ndaGeneratorConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as NdaOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output.ndaText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nda-agreement.txt";
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
        <button type="button" onClick={() => openPaywall(ndaGeneratorConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating
          ? <><Loader2 className="h-4 w-4 animate-spin" />Generating NDA...</>
          : <><Coins className="h-4 w-4" />Generate NDA — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{ndaGeneratorConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {ndaGeneratorConfig.description}
            </p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="nda-generator"
          currentInputs={formValues}
          planSlug={planSlug}
          onPresetLoad={(inputs) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.entries(inputs).forEach(([key, value]) => setValue(key as any, value, { shouldValidate: false }));
            toast.success('Preset loaded!');
          }}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Party A */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Party A — {selectedType === "one-way" ? "Disclosing Party" : "First Party"}
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
              <Controller
                name="partyAName"
                control={control}
                render={({ field }) => (
                  <SmartInput field="businessName" value={field.value || ""} onChange={field.onChange}
                    placeholder="Full name or company name"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
                )}
              />
              {errors.partyAName && <p className="text-xs text-destructive">{errors.partyAName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Address <span className="text-destructive">*</span></label>
              <Controller
                name="partyAAddress"
                control={control}
                render={({ field }) => (
                  <SmartInput field="address" value={field.value || ""} onChange={field.onChange}
                    placeholder="Complete address"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
                )}
              />
              {errors.partyAAddress && <p className="text-xs text-destructive">{errors.partyAAddress.message}</p>}
            </div>
          </div>

          {/* Party B */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Party B — {selectedType === "one-way" ? "Receiving Party" : "Second Party"}
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
              <input {...register("partyBName")} placeholder="Full name or company name"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.partyBName && <p className="text-xs text-destructive">{errors.partyBName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Address <span className="text-destructive">*</span></label>
              <textarea {...register("partyBAddress")} rows={2} placeholder="Complete address"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
              {errors.partyBAddress && <p className="text-xs text-destructive">{errors.partyBAddress.message}</p>}
            </div>
          </div>

          {/* NDA Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">NDA Type</label>
            <div className="flex flex-wrap gap-2">
              <Pill label="One-Way" active={selectedType === "one-way"} onClick={() => setValue("ndaType", "one-way")} />
              <Pill label="Mutual" active={selectedType === "mutual"} onClick={() => setValue("ndaType", "mutual")} />
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedType === "one-way"
                ? "Only Party A shares confidential information with Party B"
                : "Both parties share confidential information with each other"}
            </p>
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Purpose of Disclosure <span className="text-destructive">*</span></label>
            <textarea {...register("purpose")} rows={3}
              placeholder="e.g. Exploring a potential business partnership for developing a mobile app"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confidentiality Duration</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "6", label: "6 months" },
                { value: "12", label: "1 year" },
                { value: "24", label: "2 years" },
                { value: "36", label: "3 years" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedDuration === value}
                  onClick={() => setValue("durationMonths", value)} />
              ))}
            </div>
          </div>

          {/* Jurisdiction */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Governing Jurisdiction <span className="text-destructive">*</span></label>
            <input {...register("jurisdiction")} placeholder="e.g. Maharashtra, Delhi, Karnataka"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.jurisdiction && <p className="text-xs text-destructive">{errors.jurisdiction.message}</p>}
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Review with a lawyer before signing.
            </p>
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Lock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">NDA will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in all details and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Generating NDA document...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${60 + (i * 5) % 35}%` }} />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1" />
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(output.ndaText); toast.success("NDA copied"); }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Copy className="h-3.5 w-3.5" />Copy
              </button>
              <button type="button" onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Download className="h-3.5 w-3.5" />Download .txt
              </button>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                {output.ndaText}
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Summary</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{output.summary}</p>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This is AI-generated content for reference only. Consult a qualified lawyer before signing.
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
