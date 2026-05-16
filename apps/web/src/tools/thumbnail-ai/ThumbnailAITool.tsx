"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { thumbnailAISchema, type ThumbnailAIInput } from "./schema";
import { thumbnailAIConfig } from "./config";
import { Image as ImageIcon, Coins, Loader2, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { ThumbnailHistory } from "./ThumbnailHistory";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface ThumbnailOutput {
  imageUrl: string;
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

export default function ThumbnailAITool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? thumbnailAIConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<ThumbnailOutput | null>(null);
  const [lastFormData, setLastFormData] = useState<ThumbnailAIInput | null>(null);
  const [newThumbnail, setNewThumbnail] = useState<{ imageUrl: string; prompt: string } | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ThumbnailAIInput>({
    resolver: zodResolver(thumbnailAISchema),
    defaultValues: { style: "youtube-thumbnail", colorScheme: "vibrant" },
  });

  const selectedStyle = watch("style");
  const selectedColor = watch("colorScheme");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('thumbnail-ai');
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

  async function generate(data: ThumbnailAIInput) {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(thumbnailAIConfig.name, creditCost); return; }

    setIsGenerating(true);
    setLastFormData(data);
    try {
      const res = await fetch("/api/tools/thumbnail-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(thumbnailAIConfig.name, creditCost); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "generation_failed");
      }
      const json = await res.json();
      const result = json.output as ThumbnailOutput;
      setOutput(result);
      deductLocally(creditCost);
      // Notify history gallery of the new thumbnail
      setNewThumbnail({ imageUrl: result.imageUrl, prompt: data.mainSubject });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed.";
      toast.error(msg.includes("storage not configured") ? "Image storage not configured. Contact support." : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function downloadImage() {
    if (!output) return;
    try {
      const res = await fetch(output.imageUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "thumbnail.png";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(output.imageUrl, "_blank");
    }
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
        <button type="button" onClick={() => openPaywall(thumbnailAIConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <div className="space-y-1">
        <button type="submit" disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Coins className="h-4 w-4" />Generate Thumbnail — {creditCost} credits</>}
        </button>
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <AlertTriangle className="h-3 w-3" />Takes 20–30 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Two-panel tool layout */}
      <div className="flex flex-col lg:flex-row">
        {/* LEFT PANEL */}
        <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
              <ImageIcon className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{thumbnailAIConfig.name}</h1>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{creditCost} credits</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{thumbnailAIConfig.description}</p>
            </div>
          </div>

          {/* Preset selector */}
          <PresetSelector
            toolSlug="thumbnail-ai"
            currentInputs={formValues}
            planSlug={planSlug}
            onPresetLoad={(inputs) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Object.entries(inputs).forEach(([key, value]) => setValue(key as any, value, { shouldValidate: false }));
              toast.success('Preset loaded!');
            }}
          />

          <form onSubmit={handleSubmit(generate)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Video / Post Title <span className="text-destructive">*</span></label>
              <input {...register("videoTitle")} placeholder="e.g. How I Made ₹1 Lakh in 30 Days" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.videoTitle && <p className="text-xs text-destructive">{errors.videoTitle.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "youtube-thumbnail", label: "YouTube Thumbnail" },
                  { value: "instagram-post", label: "Instagram Post" },
                  { value: "linkedin-banner", label: "LinkedIn Banner" },
                  { value: "blog-header", label: "Blog Header" },
                ] as const).map(({ value, label }) => (
                  <Pill key={value} label={label} active={selectedStyle === value} onClick={() => setValue("style", value)} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Color Scheme</label>
              <div className="flex flex-wrap gap-2">
                {(["vibrant", "dark", "minimal", "colorful"] as const).map((c) => (
                  <Pill key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} active={selectedColor === c} onClick={() => setValue("colorScheme", c)} />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Main Subject <span className="text-destructive">*</span></label>
              <textarea {...register("mainSubject")} rows={3} placeholder="Describe what should appear in the image — e.g. Person looking surprised at laptop, office background, professional setting" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
              {errors.mainSubject && <p className="text-xs text-destructive">{errors.mainSubject.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Text Overlay <span className="text-muted-foreground font-normal">(optional, max 50 chars)</span>
              </label>
              <input {...register("textOverlay")} placeholder="Short text to appear on thumbnail" maxLength={50} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            </div>

            <GenerateButton />
          </form>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
          {!isGenerating && !output && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Your thumbnail will appear here</p>
              <p className="text-xs text-muted-foreground mt-1">Describe your thumbnail and click Generate</p>
            </div>
          )}

          {isGenerating && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-sm font-semibold text-foreground">Creating your thumbnail...</p>
              <p className="text-xs text-muted-foreground">Generating with Best AI Model</p>
              <p className="text-xs text-muted-foreground">This takes 20–30 seconds</p>
            </div>
          )}

          {!isGenerating && output && (
            <div className="space-y-4">
              <img
                src={output.imageUrl}
                alt="Generated thumbnail"
                className="w-full rounded-xl border border-border object-cover"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  {creditCost} credits used
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={downloadImage}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                    <Download className="h-3.5 w-3.5" />Download
                  </button>
                  <button
                    type="button"
                    onClick={() => lastFormData && generate(lastFormData)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-60 transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" />Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History gallery — only for logged-in users */}
      {status === "authenticated" && (
        <div className="border-t border-border px-4 md:px-6 pb-8">
          <ThumbnailHistory newThumbnail={newThumbnail} />
        </div>
      )}
    </div>
  );
}
