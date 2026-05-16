"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogGeneratorSchema, type BlogGeneratorInput } from "./schema";
import { blogGeneratorConfig } from "./config";
import {
  FileText, Coins, Loader2, Copy, CheckCheck, Download,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { useStreamingOutput } from "@/hooks/useStreamingOutput";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogSection { heading: string; content: string }
interface BlogOutput {
  title: string;
  metaDescription: string;
  sections: BlogSection[];
  conclusion: string;
  cta: string;
}

// ── Plain-text parser (matches the streaming prompt format) ───────────────────

function parseStreamedBlog(raw: string): BlogOutput | null {
  try {
    const titleMatch = raw.match(/^TITLE:\s*(.+)$/m);
    const metaMatch = raw.match(/^META:\s*(.+)$/m);

    const sectionBlocks = raw
      .split(/---SECTION---/g)
      .slice(1)
      .map((block) => {
        const headingMatch = block.match(/^##\s*(.+)$/m);
        const heading = headingMatch?.[1]?.trim() ?? "";
        const content = block.replace(/^##\s*.+$/m, "").trim();
        return { heading, content };
      })
      .filter((s) => s.heading && s.content);

    const conclusionMatch = raw.match(/---CONCLUSION---\s*([\s\S]*?)(?=---CTA---|$)/);
    const ctaMatch = raw.match(/---CTA---\s*([\s\S]*?)$/);

    if (!titleMatch || sectionBlocks.length === 0) return null;

    return {
      title: titleMatch[1].trim(),
      metaDescription: metaMatch?.[1]?.trim() ?? "",
      sections: sectionBlocks,
      conclusion: conclusionMatch?.[1]?.trim() ?? "",
      cta: ctaMatch?.[1]?.trim() ?? "",
    };
  } catch {
    return null;
  }
}

function wordCount(raw: string): number {
  return raw.trim().split(/\s+/).filter(Boolean).length;
}

// ── Pill button ───────────────────────────────────────────────────────────────

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

// ── Typing cursor ─────────────────────────────────────────────────────────────

function TypingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVisible((v) => !v), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className="inline-block w-0.5 h-4 bg-accent align-middle ml-0.5 transition-opacity"
      style={{ opacity: visible ? 1 : 0 }}
    />
  );
}

// ── Streaming skeleton ────────────────────────────────────────────────────────

function StreamingSkeleton({ charCount }: { charCount: number }) {
  const progress = Math.min(charCount / 3000, 1);
  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-accent" />
            Writing your blog...
          </span>
          <span>{charCount} chars</span>
        </div>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${Math.max(5, progress * 100)}%` }}
          />
        </div>
      </div>

      {/* Animated skeleton rows */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
        </div>
        <hr className="border-border" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Blog output renderer ──────────────────────────────────────────────────────

function BlogOutput({
  output,
  creditCost,
  onCopy,
  onDownload,
  copied,
}: {
  output: BlogOutput;
  creditCost: number;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          ~{wordCount(
            [output.title, output.metaDescription, ...output.sections.flatMap((s) => [s.heading, s.content]), output.conclusion, output.cta].join(" ")
          )} words
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
        >
          {copied ? (
            <><CheckCheck className="h-3.5 w-3.5 text-green-500" />Copied!</>
          ) : (
            <><Copy className="h-3.5 w-3.5" />Copy All</>
          )}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download .txt
        </button>
      </div>

      {/* Blog content */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground leading-snug mb-1">
            {output.title}
          </h2>
          {output.metaDescription && (
            <p className="text-sm italic text-muted-foreground">{output.metaDescription}</p>
          )}
        </div>

        <hr className="border-border" />

        {output.sections.map((section, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">{section.heading}</h3>
            <p className="text-sm text-foreground leading-relaxed">{section.content}</p>
          </div>
        ))}

        {output.conclusion && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">Conclusion</h3>
            <p className="text-sm text-foreground leading-relaxed">{output.conclusion}</p>
          </div>
        )}

        {output.cta && (
          <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-accent">Call to Action</h3>
            <p className="text-sm text-foreground leading-relaxed">{output.cta}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface BlogGeneratorToolProps { creditCost?: number }

export default function BlogGeneratorTool({ creditCost: creditCostProp }: BlogGeneratorToolProps) {
  const creditCost = creditCostProp ?? blogGeneratorConfig.creditCost;
  const { data: session, status } = useSession();
  const { balance, deductLocally, setBalance } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const { state: stream, startStream, reset: resetStream } = useStreamingOutput();
  const [parsedOutput, setParsedOutput] = useState<BlogOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BlogGeneratorInput>({
    resolver: zodResolver(blogGeneratorSchema),
    defaultValues: { tone: "professional", length: "medium" },
  });

  const selectedTone = watch("tone");
  const selectedLength = watch("length");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('blog-generator');
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

  // Parse output when stream finishes
  useEffect(() => {
    if (stream.isDone && stream.text) {
      const parsed = parseStreamedBlog(stream.text);
      if (parsed) {
        setParsedOutput(parsed);
        if (stream.newBalance !== null) {
          setBalance(stream.newBalance);
        }
      }
    }
  }, [stream.isDone, stream.text, stream.newBalance, deductLocally]);

  // Show error toast
  useEffect(() => {
    if (!stream.error) return;
    if (stream.error === "insufficient_credits") {
      openPaywall(blogGeneratorConfig.name, creditCost);
    } else {
      toast.error("Generation failed. Please try again.");
    }
  }, [stream.error, creditCost, openPaywall]);

  const onSubmit = async (data: BlogGeneratorInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(blogGeneratorConfig.name, creditCost); return; }

    setParsedOutput(null);
    resetStream();

    await startStream("/api/tools/blog-generator/stream", data);
  };

  const isGenerating = stream.isStreaming;
  const hasOutput = parsedOutput !== null;

  function buildFullText(): string {
    if (!parsedOutput) return "";
    return [
      parsedOutput.title,
      "",
      parsedOutput.metaDescription,
      "",
      ...parsedOutput.sections.flatMap((s) => [s.heading, s.content, ""]),
      "Conclusion:",
      parsedOutput.conclusion,
      "",
      "Call to Action:",
      parsedOutput.cta,
    ].join("\n");
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(buildFullText());
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!parsedOutput) return;
    const topic = watch("topic") ?? "blog";
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const date = new Date().toISOString().split("T")[0];
    const blob = new Blob([buildFullText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `blog-${slug}-${date}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* ── LEFT PANEL (45%) ──────────────────────────────────────────────── */}
      <div className="lg:w-[45%] lg:border-r border-border p-6 space-y-5 overflow-y-auto">
        {/* Tool header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{blogGeneratorConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {blogGeneratorConfig.description}
            </p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="blog-generator"
          currentInputs={formValues}
          planSlug={planSlug}
          onPresetLoad={(inputs) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.entries(inputs).forEach(([key, value]) => setValue(key as any, value, { shouldValidate: false }));
            toast.success('Preset loaded!');
          }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Blog Topic <span className="text-destructive">*</span>
            </label>
            <input
              {...register("topic")}
              disabled={isGenerating}
              placeholder="e.g. 10 GST tips for small business owners"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {errors.topic && <p className="text-xs text-destructive">{errors.topic.message}</p>}
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Writing Tone <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(["professional", "casual", "funny", "educational"] as const).map((t) => (
                <Pill
                  key={t}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                  active={selectedTone === t}
                  onClick={() => !isGenerating && setValue("tone", t, { shouldValidate: true })}
                />
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Blog Length <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "short", label: "Short (~500w)" },
                { value: "medium", label: "Medium (~1000w)" },
                { value: "long", label: "Long (~1500w)" },
              ] as const).map(({ value, label }) => (
                <Pill
                  key={value}
                  label={label}
                  active={selectedLength === value}
                  onClick={() => !isGenerating && setValue("length", value, { shouldValidate: true })}
                />
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Target Audience{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              {...register("targetAudience")}
              disabled={isGenerating}
              placeholder="e.g. Small business owners in India"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Keywords */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              SEO Keywords{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              {...register("keywords")}
              disabled={isGenerating}
              placeholder="e.g. GST filing, tax saving, invoice"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Generate button */}
          {status === "unauthenticated" ? (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              <Coins className="h-4 w-4" />
              Login to Generate
            </button>
          ) : balance < creditCost ? (
            <button
              type="button"
              onClick={() => openPaywall(blogGeneratorConfig.name, creditCost)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              <Coins className="h-4 w-4" />
              Buy Credits
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
                <><Coins className="h-4 w-4" />Generate Blog — {creditCost} credits</>
              )}
            </button>
          )}
        </form>
      </div>

      {/* ── RIGHT PANEL (55%) ─────────────────────────────────────────────── */}
      <div className="lg:w-[55%] p-6 overflow-y-auto">
        {/* Empty state */}
        {!isGenerating && !stream.isDone && !stream.error && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your blog will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details and click Generate</p>
          </div>
        )}

        {/* Streaming state — skeleton + progress */}
        {isGenerating && (
          <StreamingSkeleton charCount={stream.text.length} />
        )}

        {/* Streaming done — but parsing failed, show raw */}
        {stream.isDone && !parsedOutput && stream.text && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Raw output (parsing in progress)<TypingCursor />
            </p>
            <pre className="whitespace-pre-wrap text-xs font-mono text-foreground leading-relaxed max-h-[60vh] overflow-y-auto p-4 rounded-xl border border-border bg-surface">
              {stream.text}
            </pre>
          </div>
        )}

        {/* Generated output — parsed */}
        {hasOutput && (
          <BlogOutput
            output={parsedOutput!}
            creditCost={creditCost}
            onCopy={handleCopyAll}
            onDownload={handleDownload}
            copied={copied}
          />
        )}
      </div>
    </div>
  );
}
