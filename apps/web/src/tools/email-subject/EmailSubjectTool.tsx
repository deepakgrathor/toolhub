"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailSubjectSchema, type EmailSubjectInput } from "./schema";
import { emailSubjectConfig } from "./config";
import { AtSign, Coins, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

interface EmailSubjectOutput {
  subjects: string[];
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

export default function EmailSubjectTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? emailSubjectConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<EmailSubjectOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmailSubjectInput>({
    resolver: zodResolver(emailSubjectSchema),
    defaultValues: { tone: "professional", count: "5" },
  });

  const selectedTone = watch("tone");
  const selectedCount = watch("count");

  const onSubmit = async (data: EmailSubjectInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(emailSubjectConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/email-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(emailSubjectConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as EmailSubjectOutput);
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
        <button type="button" onClick={() => openPaywall(emailSubjectConfig.name, creditCost)}
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
          : <><Coins className="h-4 w-4" />Generate Subject Lines — {creditCost} credit</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <AtSign className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{emailSubjectConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credit
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {emailSubjectConfig.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              What is your email about? <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register("emailGoal")}
              rows={4}
              placeholder="e.g. We are launching a 30% Diwali sale on all products for existing customers this weekend only"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none"
            />
            {errors.emailGoal && <p className="text-xs text-destructive">{errors.emailGoal.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tone</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "professional", label: "Professional" },
                { value: "casual", label: "Casual" },
                { value: "urgent", label: "Urgent" },
                { value: "friendly", label: "Friendly" },
                { value: "promotional", label: "Promotional" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedTone === value}
                  onClick={() => setValue("tone", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Count</label>
            <div className="flex flex-wrap gap-2">
              {(["5", "10"] as const).map((c) => (
                <Pill key={c} label={`${c} subject lines`} active={selectedCount === c}
                  onClick={() => setValue("count", c)} />
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
            <AtSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Subject lines will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Describe your email and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Crafting subject lines...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${60 + (i * 7) % 35}%` }} />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{output.subjects.length} subject lines</p>
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(output.subjects.join("\n")); toast.success("All copied"); }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Copy className="h-3.5 w-3.5" />Copy All
              </button>
            </div>

            <div className="space-y-2">
              {output.subjects.map((subject, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 group">
                  <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <p className="flex-1 text-sm text-foreground">{subject}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{subject.length}c</span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(subject); toast.success("Copied"); }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-1 hover:bg-muted transition-all"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
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
