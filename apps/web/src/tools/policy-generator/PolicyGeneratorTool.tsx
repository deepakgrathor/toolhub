"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policyGeneratorSchema, type PolicyGeneratorInput } from "./schema";
import { policyGeneratorConfig } from "./config";
import { Shield, Coins, Loader2, Copy, Download } from "lucide-react";
import { SmartInput } from "@/components/ui/SmartInput";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

interface PolicySection {
  heading: string;
  content: string;
}

interface PolicyOutput {
  policyTitle: string;
  sections: PolicySection[];
  fullPolicy: string;
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

const POLICY_OPTIONS = [
  { value: "leave-policy", label: "Leave Policy" },
  { value: "work-from-home", label: "Work From Home" },
  { value: "code-of-conduct", label: "Code of Conduct" },
  { value: "data-privacy", label: "Data Privacy" },
  { value: "expense-reimbursement", label: "Expense Reimbursement" },
  { value: "anti-harassment", label: "Anti-Harassment" },
  { value: "social-media", label: "Social Media" },
  { value: "attendance", label: "Attendance" },
] as const;

export default function PolicyGeneratorTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? policyGeneratorConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<PolicyOutput | null>(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<PolicyGeneratorInput>({
    resolver: zodResolver(policyGeneratorSchema),
    defaultValues: { policyType: "leave-policy", companySize: "small" },
  });

  const selectedPolicy = watch("policyType");
  const selectedSize = watch("companySize");
  const formValues = watch() as unknown as Record<string, string>;

  const [planSlug, setPlanSlug] = useState('free');
  const { presets, isFetched, fetchPresets } = usePresets('policy-generator');
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

  const onSubmit = async (data: PolicyGeneratorInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < creditCost) { openPaywall(policyGeneratorConfig.name, creditCost); return; }

    setIsGenerating(true);
    setOutput(null);
    try {
      const res = await fetch("/api/tools/policy-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(policyGeneratorConfig.name, creditCost); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as PolicyOutput);
      deductLocally(creditCost);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  function downloadTxt() {
    if (!output) return;
    const blob = new Blob([output.fullPolicy], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${output.policyTitle.toLowerCase().replace(/\s+/g, "-")}.txt`;
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
        <button type="button" onClick={() => openPaywall(policyGeneratorConfig.name, creditCost)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <button type="submit" disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Coins className="h-4 w-4" />Generate Policy — {creditCost} credits</>}
      </button>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{policyGeneratorConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{creditCost} credits</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{policyGeneratorConfig.description}</p>
          </div>
        </div>

        {/* Preset selector */}
        <PresetSelector
          toolSlug="policy-generator"
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
            <label className="text-sm font-medium text-foreground">Company Name <span className="text-destructive">*</span></label>
            <Controller
              name="companyName"
              control={control}
              render={({ field }) => (
                <SmartInput field="businessName" value={field.value || ""} onChange={field.onChange}
                  placeholder="e.g. SetuLabsAI Pvt. Ltd."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              )}
            />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Policy Type <span className="text-destructive">*</span></label>
            <select
              value={selectedPolicy}
              onChange={(e) => setValue("policyType", e.target.value as PolicyGeneratorInput["policyType"])}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
            >
              {POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company Size</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "startup", label: "Startup" },
                { value: "small", label: "Small (10–50)" },
                { value: "medium", label: "Medium (50–500)" },
                { value: "enterprise", label: "Enterprise (500+)" },
              ] as const).map(({ value, label }) => (
                <Pill key={value} label={label} active={selectedSize === value} onClick={() => setValue("companySize", value)} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Industry <span className="text-destructive">*</span></label>
            <input {...register("industry")} placeholder="e.g. Software / IT, Manufacturing, Retail" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.industry && <p className="text-xs text-destructive">{errors.industry.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Additional Requirements <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea {...register("additionalPoints")} rows={3} placeholder="Any specific clauses or requirements to include..." className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
          </div>

          <GenerateButton />
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your policy document will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details and click Generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Generating policy document...</p>
            <div className="w-full max-w-md space-y-2 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{output.policyTitle}</h2>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => { navigator.clipboard.writeText(output.fullPolicy); toast.success("Policy copied"); }}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Copy className="h-3.5 w-3.5" />Copy All
                </button>
                <button type="button" onClick={downloadTxt}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Download className="h-3.5 w-3.5" />Download .txt
                </button>
              </div>
            </div>

            {Array.isArray(output.sections) && output.sections.map((section, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            ))}

            <p className="text-xs text-muted-foreground text-right">{creditCost} credits used</p>
          </div>
        )}
      </div>
    </div>
  );
}
