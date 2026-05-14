"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2, Copy, Download, RefreshCw, Sparkles, Check,
  ExternalLink, Code2, Eye, AlertCircle, FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { LoginBanner } from "@/components/tools/LoginBanner";
import { PDFPreviewModal, type BrandAssets } from "@/components/ui/PDFPreviewModal";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "file";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  maxLength?: number;
  helpText?: string;
  order: number;
}

interface ToolConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  kitSlug: string;
  kitName: string;
  creditCost: number;
  isActive: boolean;
  type: string;
  outputType: "text" | "html" | "image" | "json";
  outputLabel: string;
  formFields: FormField[];
  aiModel: string;
  dailyLimit: number;
  requiredPlan: string;
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
        className
      )}
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Form field renderer ────────────────────────────────────────────────────────

function FormFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (val: string) => void;
}) {
  const baseInput = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {field.type === "text" && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.maxLength}
          className={baseInput}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          rows={4}
          className={cn(baseInput, "resize-y min-h-[100px]")}
        />
      )}

      {field.type === "select" && (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={baseInput}
        >
          <option value="">Select {field.label}</option>
          {(field.options ?? []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "number" && (
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          defaultValue={field.defaultValue ?? ""}
          className={baseInput}
        />
      )}

      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}

// ── Output renderer ────────────────────────────────────────────────────────────

function OutputRenderer({
  output,
  outputType,
  outputLabel,
}: {
  output: string;
  outputType: "text" | "html" | "image" | "json";
  outputLabel: string;
}) {
  const [htmlTab, setHtmlTab] = useState<"preview" | "code">("preview");
  const wordCount = outputType === "text"
    ? output.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (outputType === "text" || outputType === "json") {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{outputLabel}</span>
            {wordCount > 0 && (
              <span className="text-xs text-muted-foreground">{wordCount} words</span>
            )}
          </div>
          <CopyButton text={output} />
        </div>
        <div className="p-4 max-h-[500px] overflow-y-auto">
          {outputType === "json" ? (
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
              {(() => { try { return JSON.stringify(JSON.parse(output), null, 2); } catch { return output; } })()}
            </pre>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{output}</p>
          )}
        </div>
      </div>
    );
  }

  if (outputType === "html") {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHtmlTab("preview")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                htmlTab === "preview"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
            <button
              onClick={() => setHtmlTab("code")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                htmlTab === "code"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Code2 className="h-3 w-3" /> Code
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const win = window.open("", "_blank");
                if (win) { win.document.write(output); win.document.close(); }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Open
            </button>
            <CopyButton text={output} />
          </div>
        </div>
        {htmlTab === "preview" ? (
          <iframe
            srcDoc={output}
            className="w-full h-[500px] border-0"
            sandbox="allow-scripts"
            title="Preview"
          />
        ) : (
          <div className="p-4 max-h-[500px] overflow-auto">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>
    );
  }

  if (outputType === "image") {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">{outputLabel}</span>
          <div className="flex items-center gap-2">
            <a
              href={output}
              download
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download className="h-3 w-3" /> Download
            </a>
            <CopyButton text={output} />
          </div>
        </div>
        <div className="p-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={output}
            alt="Generated image"
            className="max-w-full max-h-[480px] rounded-lg object-contain"
          />
        </div>
      </div>
    );
  }

  return null;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ConfigSkeleton() {
  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row animate-pulse">
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-3 w-60 rounded bg-muted" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-9 rounded-lg bg-muted" />
          </div>
        ))}
        <div className="h-10 rounded-lg bg-muted" />
      </div>
      <div className="lg:w-[55%] p-4 md:p-6">
        <div className="h-full min-h-[300px] rounded-xl bg-muted" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UniversalToolRenderer({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<ToolConfig | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [output, setOutput]         = useState("");
  const [genError, setGenError]     = useState("");
  const [cooldown, setCooldown]     = useState(0);
  const [planSlug, setPlanSlug]     = useState("free");
  const [downloading, setDownloading] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [brandAssets, setBrandAssets] = useState<BrandAssets | null>(null);

  const { presets, isFetched, fetchPresets } = usePresets(slug);
  const defaultLoadedRef = useRef(false);

  // Fetch tool config + plan on mount
  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch(`/api/tools/${slug}/config`).then(r => r.json()),
      fetch("/api/user/plan").then(r => r.json()).catch(() => ({ planSlug: "free" })),
    ])
      .then(([data, planData]: [ToolConfig & { error?: string }, { planSlug?: string }]) => {
        if (data.error) { setError(data.error); return; }
        setConfig(data);
        const defaults: Record<string, string> = {};
        (data.formFields ?? []).forEach(f => {
          defaults[f.key] = f.defaultValue ?? "";
        });
        setFormValues(defaults);
        const plan = planData?.planSlug ?? "free";
        setPlanSlug(plan);
        if (plan !== "free" && plan !== "lite") {
          fetch("/api/profile/brand-assets")
            .then(r => r.json())
            .then((assets: BrandAssets) => setBrandAssets(assets))
            .catch(() => null);
        }
      })
      .catch(() => setError("Failed to load tool"))
      .finally(() => setLoading(false));
  }, [slug, session]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Fetch presets once session is ready
  useEffect(() => {
    if (!session) return;
    fetchPresets();
  }, [fetchPresets, session]);

  // Auto-load default preset once after presets are fetched
  useEffect(() => {
    if (!isFetched || defaultLoadedRef.current) return;
    const defaultPreset = presets.find(p => p.isDefault);
    if (defaultPreset) {
      setFormValues(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(defaultPreset.inputs).filter(([k]) => k in prev)
        ),
      }));
      defaultLoadedRef.current = true;
    }
  }, [isFetched, presets]);

  function setField(key: string, val: string) {
    setFormValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleDownloadPDF() {
    if (!config || !output) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/tools/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug: slug, toolName: config.name, content: output }),
      });

      if (res.status === 403) {
        const { toast } = await import("sonner");
        toast.error("PDF download requires LITE plan. Upgrade to download.");
        return;
      }

      if (!res.ok) throw new Error("Failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-output.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const { toast } = await import("sonner");
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleGenerate() {
    if (!config || generating) return;
    setGenerating(true);
    setGenError("");

    try {
      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug: slug, inputs: formValues }),
      });
      const data = await res.json() as {
        output?: string;
        error?: string;
        retryAfter?: number;
      };

      if (!res.ok) {
        if (res.status === 402) {
          router.push("/pricing");
          return;
        }
        if (res.status === 429) {
          setCooldown(data.retryAfter ?? 30);
          setGenError(data.error ?? "Rate limit reached. Please wait.");
          return;
        }
        setGenError(data.error ?? "Generation failed. Please try again.");
        return;
      }

      setOutput(data.output ?? "");
    } catch {
      setGenError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <LoginBanner />
      </div>
    );
  }

  if (loading) return <ConfigSkeleton />;

  if (error || !config) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">Tool unavailable</p>
          <p className="text-xs text-muted-foreground mt-1">{error || "This tool could not be loaded."}</p>
        </div>
      </div>
    );
  }

  if (!config.isActive) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">{config.name} is temporarily unavailable</p>
          <p className="text-xs text-muted-foreground mt-1">This tool has been paused. Check back soon.</p>
        </div>
      </div>
    );
  }

  const sortedFields = [...(config.formFields ?? [])].sort((a, b) => a.order - b.order);

  return (
    <>
    {config && showPDFPreview && (
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        toolSlug={slug}
        toolName={config.name}
        content={output}
        planSlug={planSlug}
        brandAssets={brandAssets}
      />
    )}
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* ── Left: Form ── */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5">

        {/* Tool header */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
            style={{ backgroundColor: `${config.color}18` }}
          >
            <DynamicIcon
              name={config.icon}
              size={22}
              className="text-accent"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{config.name}</h1>
              {config.creditCost === 0 ? (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">FREE</span>
              ) : (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                  {config.creditCost} credits
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>
            {config.kitName && (
              <span className="inline-block mt-1.5 text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                {config.kitName}
              </span>
            )}
          </div>
        </div>

        <LoginBanner />

        {/* Preset selector — AI tools only */}
        {config.type === 'ai' && (
          <div className="mb-1">
            <PresetSelector
              toolSlug={slug}
              currentInputs={formValues}
              planSlug={planSlug}
              onPresetLoad={(inputs) => {
                setFormValues(prev => ({
                  ...prev,
                  ...Object.fromEntries(
                    Object.entries(inputs).filter(([k]) => k in prev)
                  ),
                }));
                import('sonner').then(({ toast }) => toast.success('Preset loaded!'));
              }}
            />
          </div>
        )}

        {/* Generated form fields */}
        {sortedFields.map(field => (
          <FormFieldRenderer
            key={field.key}
            field={field}
            value={formValues[field.key] ?? ""}
            onChange={val => setField(field.key, val)}
          />
        ))}

        {/* Error message */}
        {genError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{genError}</p>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || cooldown > 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity",
            "bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : cooldown > 0 ? (
            <>Wait {cooldown}s</>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate {config.outputLabel}
              {config.creditCost > 0 && (
                <span className="ml-1 text-xs font-normal opacity-75">
                  · {config.creditCost} credit{config.creditCost !== 1 ? "s" : ""}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ── Right: Output ── */}
      <div className="lg:w-[55%] p-4 md:p-6">
        {output ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Output
              </span>
              <div className="flex items-center gap-2">
                {/* Download PDF — only for text/json output */}
                {(config.outputType === "text" || config.outputType === "json") && (
                  <div className="relative group">
                    <button
                      onClick={() => setShowPDFPreview(true)}
                      disabled={downloading}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      {downloading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> PDF...</>
                      ) : (
                        <>
                          <FileDown className="h-3.5 w-3.5" />
                          PDF
                          {planSlug !== "free" && planSlug !== "lite" && (
                            <span className="rounded-full bg-primary/15 px-1.5 text-primary text-[10px]">Branded</span>
                          )}
                        </>
                      )}
                    </button>
                    {planSlug !== "free" && planSlug !== "lite" && (
                      <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 w-48 rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground shadow-lg">
                        Downloading with your brand logo &amp; signature
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className={cn("h-3 w-3", generating && "animate-spin")} />
                  Regenerate
                </button>
              </div>
            </div>
            <OutputRenderer
              output={output}
              outputType={config.outputType}
              outputLabel={config.outputLabel}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
            <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Your {config.outputLabel} will appear here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fill in the form and click Generate
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
