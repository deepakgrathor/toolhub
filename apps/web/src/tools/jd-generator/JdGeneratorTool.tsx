"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jdGeneratorSchema, type JdGeneratorInput } from "./schema";
import { jdGeneratorConfig } from "./config";
import { Briefcase, Coins, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface JdOutput {
  title: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  location: string;
  workType: string;
  department: string;
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function buildJdText(jd: JdOutput): string {
  const sections = [
    `${jd.title}`,
    `Department: ${jd.department} | ${jd.workType} | ${jd.location}`,
    "",
    "Overview",
    jd.overview,
    "",
    "Responsibilities",
    ...jd.responsibilities.map((r) => `• ${r}`),
    "",
    "Requirements",
    ...jd.requirements.map((r) => `• ${r}`),
    "",
    "Good to Have",
    ...jd.niceToHave.map((r) => `• ${r}`),
    "",
    "Benefits",
    ...jd.benefits.map((r) => `• ${r}`),
  ];
  return sections.join("\n");
}

export default function JdGeneratorTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? jdGeneratorConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<JdOutput | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JdGeneratorInput>({
    resolver: zodResolver(jdGeneratorSchema),
    defaultValues: { experienceLevel: "mid", workType: "hybrid" },
  });

  const selectedExp = watch("experienceLevel");
  const selectedWork = watch("workType");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('jd-generator');
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

  const onSubmit = async (data: JdGeneratorInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(jdGeneratorConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/jd-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(jdGeneratorConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as JdOutput);
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
        <button type="button" onClick={() => openPaywall(jdGeneratorConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Coins className="h-4 w-4" />Generate JD — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Briefcase className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{jdGeneratorConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {creditCost} credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{jdGeneratorConfig.description}</p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="jd-generator"
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
              <label className="text-sm font-medium text-foreground">Job Title <span className="text-destructive">*</span></label>
              <input {...register("jobTitle")} placeholder="e.g. Senior Frontend Engineer" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.jobTitle && <p className="text-xs text-destructive">{errors.jobTitle.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Department <span className="text-destructive">*</span></label>
              <input {...register("department")} placeholder="e.g. Engineering" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Experience Level</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "entry", label: "Entry (0-2y)" },
                { value: "mid", label: "Mid (3-5y)" },
                { value: "senior", label: "Senior (5-8y)" },
                { value: "lead", label: "Lead (8y+)" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedExp === value} onClick={() => setValue("experienceLevel", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Work Type</label>
            <div className="flex flex-wrap gap-2">
              {(["remote", "onsite", "hybrid"] as const).map((w) => (
                <Pill key={w} label={w.charAt(0).toUpperCase() + w.slice(1)} active={selectedWork === w} onClick={() => setValue("workType", w)} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Key Skills <span className="text-destructive">*</span></label>
            <input {...register("skills")} placeholder="e.g. React, TypeScript, Node.js, GraphQL" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.skills && <p className="text-xs text-destructive">{errors.skills.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Location <span className="text-muted-foreground font-normal">(opt)</span></label>
              <input {...register("location")} placeholder="e.g. Bangalore" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Company Context <span className="text-muted-foreground font-normal">(opt)</span></label>
              <input {...register("companyContext")} placeholder="e.g. Series B startup" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            </div>
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your Job Description will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Writing your job description...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1" />
              <button type="button" onClick={() => { navigator.clipboard.writeText(buildJdText(output)); toast.success("JD copied"); }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Copy className="h-3.5 w-3.5" />Copy JD
              </button>
              <button type="button" onClick={() => {
                const blob = new Blob([buildJdText(output)], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `jd-${output.title.toLowerCase().replace(/\s+/g, "-")}.txt`; a.click();
                URL.revokeObjectURL(url);
              }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Download className="h-3.5 w-3.5" />Download
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">{output.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {output.department} · {output.workType} · {output.location}
              </p>
            </div>

            <hr className="border-border" />

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">Overview</h3>
              <p className="text-sm text-foreground leading-relaxed">{output.overview}</p>
            </div>

            {[
              { title: "Responsibilities", items: output.responsibilities },
              { title: "Requirements", items: output.requirements },
              { title: "Good to Have", items: output.niceToHave },
              { title: "Benefits", items: output.benefits },
            ].map(({ title, items }) => (
              <div key={title} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <BulletList items={items} />
              </div>
            ))}

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
