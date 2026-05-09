"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogGeneratorSchema, type BlogGeneratorInput } from "./schema";
import { blogGeneratorConfig } from "./config";
import {
  FileText,
  Coins,
  Loader2,
  Copy,
  Download,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

// ── Types ────────────────────────────────────────────────────────────────────

interface BlogSection {
  heading: string;
  content: string;
}

interface BlogOutput {
  title: string;
  metaDescription: string;
  sections: BlogSection[];
  conclusion: string;
  cta: string;
  wordCount: number;
}

// ── Pill button ──────────────────────────────────────────────────────────────

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

// ── Copy / Download helpers ──────────────────────────────────────────────────

function buildFullText(output: BlogOutput): string {
  return [
    output.title,
    "",
    output.metaDescription,
    "",
    ...output.sections.flatMap((s) => [s.heading, s.content, ""]),
    "Conclusion:",
    output.conclusion,
    "",
    "Call to Action:",
    output.cta,
  ].join("\n");
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BlogGeneratorTool() {
  const { data: session, status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<BlogOutput | null>(null);
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

  // ── Submit handler ──────────────────────────────────────────────────────

  const onSubmit = async (data: BlogGeneratorInput) => {
    if (status === "unauthenticated") {
      openAuthModal("login");
      return;
    }
    if (balance < blogGeneratorConfig.creditCost) {
      openPaywall(blogGeneratorConfig.name, blogGeneratorConfig.creditCost);
      return;
    }

    setIsGenerating(true);
    setOutput(null);

    try {
      const res = await fetch("/api/tools/blog-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 402) {
        openPaywall(blogGeneratorConfig.name, blogGeneratorConfig.creditCost);
        return;
      }

      if (!res.ok) {
        throw new Error("generation_failed");
      }

      const json = await res.json();
      setOutput(json.output as BlogOutput);
      deductLocally(blogGeneratorConfig.creditCost);
    } catch {
      // Silent — user can try again; no alert spam
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Button label logic ──────────────────────────────────────────────────

  function GenerateButton() {
    if (status === "unauthenticated") {
      return (
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
        >
          <Coins className="h-4 w-4" />
          Login to Generate
        </button>
      );
    }

    if (balance < blogGeneratorConfig.creditCost) {
      return (
        <button
          type="button"
          onClick={() =>
            openPaywall(blogGeneratorConfig.name, blogGeneratorConfig.creditCost)
          }
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
        >
          <Coins className="h-4 w-4" />
          Buy Credits
        </button>
      );
    }

    return (
      <button
        type="submit"
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Coins className="h-4 w-4" />
            Generate Blog — {blogGeneratorConfig.creditCost} credits
          </>
        )}
      </button>
    );
  }

  // ── Copy all ────────────────────────────────────────────────────────────

  const handleCopyAll = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(buildFullText(output));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download ────────────────────────────────────────────────────────────

  const handleDownload = () => {
    if (!output) return;
    const topic = watch("topic") ?? "blog";
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const date = new Date().toISOString().split("T")[0];
    const filename = `blog-${slug}-${date}.txt`;
    const blob = new Blob([buildFullText(output)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* ── LEFT PANEL (45%) ─────────────────────────────────────────────── */}
      <div className="lg:w-[45%] lg:border-r border-border p-6 space-y-5 overflow-y-auto">
        {/* Tool header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {blogGeneratorConfig.name}
              </h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {blogGeneratorConfig.creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {blogGeneratorConfig.description}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Blog Topic <span className="text-destructive">*</span>
            </label>
            <input
              {...register("topic")}
              placeholder="e.g. 10 GST tips for small business owners"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
            />
            {errors.topic && (
              <p className="text-xs text-destructive">{errors.topic.message}</p>
            )}
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Writing Tone <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                ["professional", "casual", "funny", "educational"] as const
              ).map((t) => (
                <Pill
                  key={t}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                  active={selectedTone === t}
                  onClick={() => setValue("tone", t, { shouldValidate: true })}
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
              {(
                [
                  { value: "short", label: "Short (~500w)" },
                  { value: "medium", label: "Medium (~1000w)" },
                  { value: "long", label: "Long (~1500w)" },
                ] as const
              ).map(({ value, label }) => (
                <Pill
                  key={value}
                  label={label}
                  active={selectedLength === value}
                  onClick={() =>
                    setValue("length", value, { shouldValidate: true })
                  }
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
              placeholder="e.g. Small business owners in India"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
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
              placeholder="e.g. GST filing, tax saving, invoice"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
            />
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* ── RIGHT PANEL (55%) ────────────────────────────────────────────── */}
      <div className="lg:w-[55%] p-6 overflow-y-auto">
        {/* Empty state */}
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Your blog will appear here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fill in the details and click Generate
            </p>
          </div>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">
              Generating your blog...
            </p>
            <p className="text-xs text-muted-foreground">
              This takes 10–15 seconds
            </p>
            <div className="w-full max-w-md space-y-2 pt-4">
              <div className="h-5 w-3/4 mx-auto rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
            </div>
          </div>
        )}

        {/* Generated state */}
        {!isGenerating && output && (
          <div className="space-y-5">
            {/* Action bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                ~{output.wordCount} words
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy All"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
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
                <p className="text-sm italic text-muted-foreground">
                  {output.metaDescription}
                </p>
              </div>

              <hr className="border-border" />

              {output.sections.map((section, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {section.heading}
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  Conclusion
                </h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {output.conclusion}
                </p>
              </div>

              <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 space-y-1.5">
                <h3 className="text-sm font-semibold text-accent">
                  Call to Action
                </h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {output.cta}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-right">
              {blogGeneratorConfig.creditCost} credits used
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
