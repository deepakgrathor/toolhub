"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { whatsappBulkSchema, type WhatsappBulkInput } from "./schema";
import { whatsappBulkConfig } from "./config";
import { MessageCircle, Coins, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface WhatsappOutput {
  messages: string[];
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

export default function WhatsappBulkTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? whatsappBulkConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<WhatsappOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WhatsappBulkInput>({
    resolver: zodResolver(whatsappBulkSchema),
    defaultValues: { messageGoal: "promotion", includeEmoji: true },
  });

  const selectedGoal = watch("messageGoal");
  const includeEmoji = watch("includeEmoji");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('whatsapp-bulk');
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

  const onSubmit = async (data: WhatsappBulkInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(whatsappBulkConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/whatsapp-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(whatsappBulkConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as WhatsappOutput);
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
        <button type="button" onClick={() => openPaywall(whatsappBulkConfig.name, creditCost)}
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
          : <><Coins className="h-4 w-4" />Generate Messages — {creditCost} credit</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <MessageCircle className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{whatsappBulkConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credit
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {whatsappBulkConfig.description}
            </p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="whatsapp-bulk"
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
              Business Type <span className="text-destructive">*</span>
            </label>
            <input
              {...register("businessType")}
              placeholder="e.g. Clothing store, CA firm, Restaurant"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
            />
            {errors.businessType && <p className="text-xs text-destructive">{errors.businessType.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Message Goal</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "promotion", label: "Promotion" },
                { value: "reminder", label: "Reminder" },
                { value: "announcement", label: "Announcement" },
                { value: "followup", label: "Follow-up" },
                { value: "greeting", label: "Greeting" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedGoal === value}
                  onClick={() => setValue("messageGoal", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Offer / Details <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              {...register("offer")}
              rows={2}
              placeholder="e.g. 30% off on all items this weekend only"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={includeEmoji}
              onClick={() => setValue("includeEmoji", !includeEmoji)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                includeEmoji ? "bg-accent" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  includeEmoji ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <label className="text-sm font-medium text-foreground">Include emojis</label>
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">WhatsApp messages will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">5 ready-to-send message templates</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Writing WhatsApp messages...</p>
            <div className="w-full max-w-md space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 rounded bg-muted animate-pulse w-4/5" />
                  <div className="h-3 rounded bg-muted animate-pulse w-full" />
                  <div className="h-3 rounded bg-muted animate-pulse w-3/5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">5 message templates</p>
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(output.messages.join("\n\n---\n\n")); toast.success("All messages copied"); }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Copy className="h-3.5 w-3.5" />Copy All
              </button>
            </div>

            <div className="space-y-3">
              {output.messages.map((msg, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Template {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{msg.length} chars</span>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(msg); toast.success("Copied"); }}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-border hover:bg-muted transition-colors"
                      >
                        <Copy className="h-3 w-3" />Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-right">{creditCost} credit used</p>
          </div>
        )}
      </div>
    </div>
  );
}
