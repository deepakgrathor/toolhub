"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hookWriterSchema, type HookWriterInput } from "./schema";
import { hookWriterConfig } from "./config";
import { Zap, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";

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

function HookCard({ hook, index }: { hook: string; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hook);
    setCopied(true);
    toast.success("Hook copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-accent bg-accent/10 rounded-full px-2 py-0.5">
          Hook {index + 1}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{hook}</p>
    </div>
  );
}

export default function HookWriterTool({ creditCost: _creditCost }: { creditCost?: number }) {
  const { status } = useSession();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HookWriterInput>({
    resolver: zodResolver(hookWriterSchema),
    defaultValues: { platform: "instagram", count: "5" },
  });

  const selectedPlatform = watch("platform");
  const selectedCount = watch("count");

  const onSubmit = async (data: HookWriterInput) => {
    if (status === "unauthenticated") {
      openAuthModal("login");
      return;
    }
    setIsGenerating(true);
    setHooks([]);
    try {
      const res = await fetch("/api/tools/hook-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setHooks((json.output?.hooks as string[]) ?? []);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{hookWriterConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
                FREE
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {hookWriterConfig.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Topic / Post Idea <span className="text-destructive">*</span>
            </label>
            <input
              {...register("topic")}
              placeholder="e.g. How I grew from 0 to 10k followers in 3 months"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
            />
            {errors.topic && (
              <p className="text-xs text-destructive">{errors.topic.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Platform</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "instagram", label: "Instagram" },
                { value: "youtube", label: "YouTube" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "twitter", label: "Twitter/X" },
              ] as const).map(({ value, label }) => (
                <Pill
                  key={value}
                  label={label}
                  active={selectedPlatform === value}
                  onClick={() => setValue("platform", value)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Number of Hooks</label>
            <div className="flex flex-wrap gap-2">
              {(["3", "5", "10"] as const).map((c) => (
                <Pill
                  key={c}
                  label={c}
                  active={selectedCount === c}
                  onClick={() => setValue("count", c)}
                />
              ))}
            </div>
          </div>

          {status === "unauthenticated" ? (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Login to Generate Free
            </button>
          ) : (
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Zap className="h-4 w-4" />Generate Hooks — Free</>
              )}
            </button>
          )}
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && hooks.length === 0 && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your hooks will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in the topic and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Writing viral hooks...</p>
            <div className="w-full max-w-md space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && hooks.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{hooks.length} hooks generated</p>
            {hooks.map((hook, i) => (
              <HookCard key={i} hook={hook} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
