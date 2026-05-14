"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { websiteGeneratorSchema, type WebsiteGeneratorInput } from "./schema";
import { websiteGeneratorConfig } from "./config";
import { Globe, Coins, Loader2, Copy, Download, Maximize2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface WebsiteOutput {
  htmlContent: string;
  pageTitle: string;
  sections: string[];
}

const LOADING_MESSAGES = [
  "Designing layout...",
  "Writing content...",
  "Adding styles...",
  "Building responsive design...",
  "Finalising your website...",
];

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", bg: "#2563eb" },
  { value: "green", label: "Green", bg: "#16a34a" },
  { value: "purple", label: "Purple", bg: "#7c3aed" },
  { value: "red", label: "Red", bg: "#dc2626" },
  { value: "orange", label: "Orange", bg: "#ea580c" },
  { value: "dark", label: "Dark", bg: "#0f172a" },
] as const;

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

export default function WebsiteGeneratorTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? websiteGeneratorConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<WebsiteOutput | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const loadingMsgRef = useRef(0);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      loadingMsgRef.current = (loadingMsgRef.current + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[loadingMsgRef.current]);
    }, 7000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WebsiteGeneratorInput>({
    resolver: zodResolver(websiteGeneratorSchema),
    defaultValues: { colorScheme: "blue", style: "modern", includeContact: true },
  });

  const selectedColor = watch("colorScheme");
  const selectedStyle = watch("style");
  const includeContact = watch("includeContact");
  const businessName = watch("businessName");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('website-generator');
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

  const onSubmit = async (data: WebsiteGeneratorInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(websiteGeneratorConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    loadingMsgRef.current = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    try {
      const res = await fetch("/api/tools/website-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(websiteGeneratorConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as WebsiteOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  function openFullscreen() {
    if (!output) return;
    const blob = new Blob([output.htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function downloadHtml() {
    if (!output) return;
    const blob = new Blob([output.htmlContent], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(businessName || "website").toLowerCase().replace(/\s+/g, "-")}.html`;
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
        <button type="button" onClick={() => openPaywall(websiteGeneratorConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <div className="space-y-1">
        <button type="submit" disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Coins className="h-4 w-4" />Generate Website — {creditCost} credits</>}
        </button>
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <AlertTriangle className="h-3 w-3" />Takes 30–45 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Globe className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{websiteGeneratorConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{creditCost} credits</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{websiteGeneratorConfig.description}</p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="website-generator"
          currentInputs={formValues}
          planSlug={planSlug}
          onPresetLoad={(inputs) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.entries(inputs).forEach(([key, value]) => setValue(key as any, value, { shouldValidate: false }));
            toast.success('Preset loaded!');
          }}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Business Name <span className="text-destructive">*</span></label>
              <input {...register("businessName")} placeholder="e.g. Sharma Traders" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Business Type <span className="text-destructive">*</span></label>
              <input {...register("businessType")} placeholder="e.g. Restaurant, CA Firm" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.businessType && <p className="text-xs text-destructive">{errors.businessType.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Business Description <span className="text-destructive">*</span></label>
            <textarea {...register("description")} rows={3} placeholder="Brief description of your business, what you do, and your key value proposition..." className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Target Audience <span className="text-destructive">*</span></label>
              <input {...register("targetAudience")} placeholder="e.g. SMEs in Mumbai" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Key Services <span className="text-destructive">*</span></label>
              <input {...register("keyServices")} placeholder="Service 1, Service 2, Service 3" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color Scheme</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(({ value, label, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("colorScheme", value)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedColor === value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: bg }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Style</label>
            <div className="flex flex-wrap gap-2">
              {(["modern", "minimal", "corporate", "creative"] as const).map((s) => (
                <Pill key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={selectedStyle === s} onClick={() => setValue("style", s)} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeContact"
                checked={includeContact}
                onChange={(e) => setValue("includeContact", e.target.checked)}
                className="rounded border-border accent-accent"
              />
              <label htmlFor="includeContact" className="text-sm font-medium text-foreground cursor-pointer">Include contact section</label>
            </div>
            {includeContact && (
              <div className="grid grid-cols-2 gap-3 pl-5">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <input {...register("phone")} placeholder="+91 98765 43210" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input {...register("email")} type="email" placeholder="hello@company.com" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
                </div>
              </div>
            )}
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your website will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in your business details and generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-sm font-semibold text-foreground">Generating your website...</p>
            <p className="text-xs text-muted-foreground">{loadingMsg}</p>
            <p className="text-xs text-muted-foreground">This takes 30–45 seconds</p>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap gap-1">
                {output.sections.map((s) => (
                  <span key={s} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{s}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={openFullscreen}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Maximize2 className="h-3.5 w-3.5" />Full Screen
                </button>
                <button type="button" onClick={downloadHtml}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Download className="h-3.5 w-3.5" />Download HTML
                </button>
                <button type="button" onClick={() => { navigator.clipboard.writeText(output.htmlContent); toast.success("HTML copied"); }}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Copy className="h-3.5 w-3.5" />Copy
                </button>
              </div>
            </div>

            <iframe
              srcDoc={output.htmlContent}
              title={output.pageTitle}
              className="w-full rounded-xl border border-border"
              style={{ height: "500px" }}
              sandbox="allow-scripts allow-same-origin"
            />

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
