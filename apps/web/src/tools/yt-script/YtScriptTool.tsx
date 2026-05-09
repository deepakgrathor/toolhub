"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ytScriptSchema, type YtScriptInput } from "./schema";
import { ytScriptConfig } from "./config";
import { Video, Coins, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

interface ScriptSegment {
  heading: string;
  content: string;
}

interface ScriptOutput {
  hook: string;
  intro: string;
  segments: ScriptSegment[];
  outro: string;
  cta: string;
  estimatedDuration: number;
  wordCount: number;
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

function buildFullScript(output: ScriptOutput): string {
  return [
    "=== HOOK ===",
    output.hook,
    "",
    "=== INTRO ===",
    output.intro,
    "",
    ...output.segments.flatMap((s) => [`=== ${s.heading.toUpperCase()} ===`, s.content, ""]),
    "=== OUTRO ===",
    output.outro,
    "",
    "=== CALL TO ACTION ===",
    output.cta,
  ].join("\n");
}

export default function YtScriptTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? ytScriptConfig.creditCost;
  const { data: session, status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<ScriptOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<YtScriptInput>({
    resolver: zodResolver(ytScriptSchema),
    defaultValues: { duration: "10", style: "educational" },
  });

  const selectedDuration = watch("duration");
  const selectedStyle = watch("style");

  const onSubmit = async (data: YtScriptInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(ytScriptConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/yt-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(ytScriptConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as ScriptOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Script generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(buildFullScript(output));
    toast.success("Script copied to clipboard");
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([buildFullScript(output)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yt-script-${Date.now()}.txt`;
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
        <button type="button" onClick={() => openPaywall(ytScriptConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Coins className="h-4 w-4" />Generate Script — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Video className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{ytScriptConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {ytScriptConfig.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Video Title <span className="text-destructive">*</span>
            </label>
            <input
              {...register("videoTitle")}
              placeholder="e.g. How to File GST Returns in 2025 — Step by Step"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
            />
            {errors.videoTitle && <p className="text-xs text-destructive">{errors.videoTitle.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Video Duration</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "5", label: "5 min" },
                { value: "10", label: "10 min" },
                { value: "15", label: "15 min" },
                { value: "20", label: "20 min" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedDuration === value} onClick={() => setValue("duration", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Video Style</label>
            <div className="flex flex-wrap gap-2">
              {(["educational", "entertaining", "documentary", "tutorial"] as const).map((s) => (
                <Pill key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={selectedStyle === s} onClick={() => setValue("style", s)} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Target Audience <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input {...register("targetAudience")} placeholder="e.g. Small business owners, beginners" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Keywords <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input {...register("keywords")} placeholder="e.g. GST, India, 2025, tax saving" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your script will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Writing your YouTube script...</p>
            <p className="text-xs text-muted-foreground">This takes 15–30 seconds</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-full rounded bg-muted animate-pulse" style={{ width: `${70 + i * 7}%` }} />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                ~{output.estimatedDuration} min video
              </span>
              <div className="flex-1" />
              <button type="button" onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Copy className="h-3.5 w-3.5" />Copy Script
              </button>
              <button type="button" onClick={handleDownload} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Download className="h-3.5 w-3.5" />Download .txt
              </button>
            </div>

            <div className="space-y-5">
              {[
                { label: "Hook", content: output.hook },
                { label: "Intro", content: output.intro },
                ...output.segments.map((s) => ({ label: s.heading, content: s.content })),
                { label: "Outro", content: output.outro },
              ].map((section, i) => (
                <div key={i} className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-accent">{section.label}</h3>
                  <p className="text-sm text-foreground leading-relaxed">{section.content}</p>
                </div>
              ))}

              <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-accent">Call to Action</h3>
                <p className="text-sm text-foreground leading-relaxed">{output.cta}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
