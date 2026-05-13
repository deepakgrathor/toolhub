"use client";

import { useState, useEffect } from "react";
import {
  X, ChevronRight, ChevronLeft, Check, Loader2,
  Plus, Trash2, ChevronUp, ChevronDown, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  placeholder: string;
  required: boolean;
  options: string[];
  defaultValue: string;
  helpText: string;
  order: number;
}

export interface ToolBuilderData {
  slug?: string;
  name: string;
  description: string;
  kitSlug: string;
  icon: string;
  color: string;
  tags: string;
  type: "ai" | "client-side";
  aiModel: string;
  outputType: "text" | "html" | "image" | "json";
  outputLabel: string;
  systemPrompt: string;
  promptTemplate: string;
  maxOutputTokens: number;
  temperature: number;
  formFields: FormField[];
  creditCost: number;
  requiredPlan: string;
  dailyLimit: number;
  isActive: boolean;
  isVisible: boolean;
}

const DEFAULTS: ToolBuilderData = {
  name: "", description: "", kitSlug: "", icon: "Sparkles", color: "#7c3aed",
  tags: "", type: "ai", aiModel: "gemini-flash-2.0",
  outputType: "text", outputLabel: "Generated Output",
  systemPrompt: "", promptTemplate: "",
  maxOutputTokens: 2000, temperature: 0.7,
  formFields: [], creditCost: 2, requiredPlan: "free",
  dailyLimit: 0, isActive: true, isVisible: true,
};

const AI_MODELS = [
  { value: "gemini-flash-2.0", label: "Gemini Flash (Ultra Fast)" },
  { value: "claude-haiku-3-5",  label: "Claude Haiku (Fast, Affordable)" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet (Smart, Quality)" },
  { value: "gpt-4o-mini",       label: "GPT-4o Mini (Fast, Cheap)" },
  { value: "gpt-4o",            label: "GPT-4o (Powerful)" },
  { value: "dall-e-3",          label: "DALL-E 3 (Image Generation)" },
];

// ── Field editor modal ────────────────────────────────────────────────────────

function FieldEditor({
  field,
  onSave,
  onClose,
}: {
  field: Partial<FormField>;
  onSave: (f: FormField) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<FormField>({
    key: "", label: "", type: "text", placeholder: "",
    required: true, options: [], defaultValue: "", helpText: "", order: 0,
    ...field,
  });
  const [optionInput, setOptionInput] = useState("");

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";

  function addOption() {
    if (!optionInput.trim()) return;
    setF(prev => ({ ...prev, options: [...prev.options, optionInput.trim()] }));
    setOptionInput("");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {field.key ? "Edit Field" : "Add Field"}
          </h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Field Key *</label>
              <input value={f.key} onChange={e => setF(p => ({ ...p, key: e.target.value.replace(/\s/g, "") }))}
                placeholder="e.g. topic" className={inp} />
              <p className="text-xs text-muted-foreground mt-0.5">Must match {"{{key}}"} in template</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Label *</label>
              <input value={f.label} onChange={e => setF(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Blog Topic" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value as FormField["type"] }))} className={inp}>
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select (dropdown)</option>
                <option value="number">Number</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <button onClick={() => setF(p => ({ ...p, required: !p.required }))}
                className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors", f.required ? "bg-primary" : "bg-muted")}>
                <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform", f.required ? "translate-x-4" : "translate-x-0")} />
              </button>
              <span className="text-sm text-foreground">Required</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Placeholder</label>
            <input value={f.placeholder} onChange={e => setF(p => ({ ...p, placeholder: e.target.value }))}
              placeholder="Hint shown in empty field" className={inp} />
          </div>
          {f.type === "select" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Options</label>
              <div className="flex gap-2">
                <input value={optionInput} onChange={e => setOptionInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                  placeholder="Add option..." className={inp} />
                <button onClick={addOption} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {f.options.map((opt, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                    {opt}
                    <button onClick={() => setF(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {f.type === "number" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Default Value</label>
              <input value={f.defaultValue} onChange={e => setF(p => ({ ...p, defaultValue: e.target.value }))}
                type="number" placeholder="e.g. 800" className={inp} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Help Text (optional)</label>
            <input value={f.helpText} onChange={e => setF(p => ({ ...p, helpText: e.target.value }))}
              placeholder="Shown below the field" className={inp} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button
            onClick={() => { if (!f.key || !f.label) return; onSave(f); }}
            disabled={!f.key || !f.label}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Check className="h-4 w-4" /> Save Field
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={cn(
          "flex-1 h-1 rounded-full transition-colors",
          i < step ? "bg-primary" : "bg-muted"
        )} />
      ))}
    </div>
  );
}

// ── Main ToolBuilder ──────────────────────────────────────────────────────────

export interface KitOption { slug: string; name: string; }

export function ToolBuilder({
  initial,
  kits,
  onClose,
  onSave,
}: {
  initial?: Partial<ToolBuilderData> & { slug?: string };
  kits: KitOption[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = !initial?.slug;
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ToolBuilderData>({ ...DEFAULTS, ...initial });
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
  const [fieldModal, setFieldModal] = useState<Partial<FormField> | false>(false);
  const [editFieldIdx, setEditFieldIdx] = useState<number | null>(null);

  const totalSteps = data.type === "ai" ? 4 : 2;

  function set<K extends keyof ToolBuilderData>(k: K, v: ToolBuilderData[K]) {
    setData(prev => ({ ...prev, [k]: v }));
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  // Extract {{keys}} from template
  const templateKeys = Array.from(
    new Set([...data.promptTemplate.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))
  );
  const fieldKeys = data.formFields.map(f => f.key);
  const missingKeys = templateKeys.filter(k => !fieldKeys.includes(k));

  function addOrUpdateField(f: FormField) {
    if (editFieldIdx !== null) {
      const updated = [...data.formFields];
      updated[editFieldIdx] = { ...f, order: editFieldIdx };
      set("formFields", updated);
    } else {
      set("formFields", [...data.formFields, { ...f, order: data.formFields.length }]);
    }
    setFieldModal(false);
    setEditFieldIdx(null);
  }

  function removeField(idx: number) {
    set("formFields", data.formFields.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i })));
  }

  function moveField(idx: number, dir: "up" | "down") {
    const arr = [...data.formFields];
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    set("formFields", arr.map((f, i) => ({ ...f, order: i })));
  }

  async function handleSave() {
    setSaving(true);
    setErr("");
    try {
      const payload = {
        ...data,
        tags: data.tags.split(",").map(t => t.trim()).filter(Boolean),
        kits: data.kitSlug ? [data.kitSlug] : [],
      };

      let res: Response;
      if (isNew) {
        res = await fetch("/api/admin/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/tools/${initial!.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json() as { error?: string };
      if (!res.ok) { setErr(result.error ?? "Save failed"); return; }
      onSave();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <div
          className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl overflow-hidden flex flex-col"
          style={{ maxHeight: "90vh" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isNew ? "Add New Tool" : `Edit Tool — ${initial?.slug}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Step {step} of {totalSteps}</p>
            </div>
            <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            <StepBar step={step} total={totalSteps} />

            {/* ── STEP 1: Basic Info ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tool Name *</label>
                    <input
                      value={data.name}
                      onChange={e => {
                        set("name", e.target.value);
                        if (isNew && !data.slug) set("slug" as keyof ToolBuilderData, autoSlug(e.target.value) as never);
                      }}
                      placeholder="e.g. LinkedIn Post Writer"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Slug {isNew ? "*" : "(read-only)"}
                    </label>
                    <input
                      value={(data as unknown as { slug?: string }).slug ?? autoSlug(data.name)}
                      onChange={e => isNew && set("slug" as keyof ToolBuilderData, e.target.value as never)}
                      disabled={!isNew}
                      placeholder="e.g. linkedin-post-writer"
                      className={cn(inp, !isNew && "opacity-60 cursor-not-allowed")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Description *</label>
                  <textarea
                    value={data.description}
                    onChange={e => set("description", e.target.value)}
                    rows={2}
                    className={cn(inp, "resize-none")}
                    placeholder="What does this tool do?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Kit *</label>
                    <select value={data.kitSlug} onChange={e => set("kitSlug", e.target.value)} className={inp}>
                      <option value="">Select a kit</option>
                      {kits.map(k => <option key={k.slug} value={k.slug}>{k.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                    <div className="flex gap-2">
                      {(["ai", "client-side"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => set("type", t)}
                          className={cn(
                            "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                            data.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {t === "ai" ? "AI Tool" : "Client-side"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Icon (Lucide name)</label>
                    <div className="flex items-center gap-2">
                      <input value={data.icon} onChange={e => set("icon", e.target.value)} placeholder="e.g. FileText" className={inp} />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <DynamicIcon name={data.icon} size={18} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (comma-separated)</label>
                    <input value={data.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. content,seo,blog" className={inp} />
                    <p className="text-xs text-muted-foreground mt-0.5">Used for recommendations</p>
                  </div>
                </div>

                {data.type === "client-side" && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Client-side tools need custom development. Configure basic info here and skip to settings.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: AI Config (only for ai type) ── */}
            {step === 2 && data.type === "ai" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">AI Configuration</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">AI Model *</label>
                    <select value={data.aiModel} onChange={e => set("aiModel", e.target.value)} className={inp}>
                      {AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Output Type</label>
                    <select value={data.outputType} onChange={e => set("outputType", e.target.value as ToolBuilderData["outputType"])} className={inp}>
                      <option value="text">Text</option>
                      <option value="html">HTML</option>
                      <option value="image">Image</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Output Label</label>
                  <input value={data.outputLabel} onChange={e => set("outputLabel", e.target.value)} placeholder="e.g. Generated Blog Post" className={inp} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">System Prompt</label>
                  <textarea
                    value={data.systemPrompt}
                    onChange={e => set("systemPrompt", e.target.value)}
                    rows={4}
                    className={cn(inp, "resize-y font-mono text-xs")}
                    placeholder="You are an expert... (not shown to users)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Prompt Template *</label>
                  <textarea
                    value={data.promptTemplate}
                    onChange={e => set("promptTemplate", e.target.value)}
                    rows={5}
                    className={cn(inp, "resize-y font-mono text-xs")}
                    placeholder={"Write a {{tone}} post about {{topic}} for {{platform}}"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use <code className="bg-muted px-1 rounded text-primary">{"{{fieldKey}}"}</code> for form inputs
                  </p>
                  {templateKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {templateKeys.map(k => (
                        <span key={k} className={cn("text-xs rounded px-1.5 py-0.5", fieldKeys.includes(k) ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                          {`{{${k}}}`} {!fieldKeys.includes(k) && "⚠ missing field"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Max Output Tokens</label>
                    <input type="number" value={data.maxOutputTokens} onChange={e => set("maxOutputTokens", Number(e.target.value))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Temperature (0–1)</label>
                    <input type="number" step={0.1} min={0} max={1} value={data.temperature} onChange={e => set("temperature", Number(e.target.value))} className={inp} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Form Builder (only for ai type) ── */}
            {step === 3 && data.type === "ai" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Form Fields ({data.formFields.length})</h3>
                  <button
                    onClick={() => { setEditFieldIdx(null); setFieldModal({}); }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Field
                  </button>
                </div>

                {missingKeys.length > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">
                      Template uses {missingKeys.map(k => `{{${k}}}`).join(", ")} but no matching fields exist.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {data.formFields.map((field, idx) => (
                    <div key={field.key} className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveField(idx, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => moveField(idx, "down")} disabled={idx === data.formFields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-mono text-primary">{`{{${field.key}}}`}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-xs text-foreground">{field.label}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground capitalize">{field.type}</span>
                        {field.required && <span className="ml-1 text-xs text-destructive">*</span>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { setEditFieldIdx(idx); setFieldModal(field); }}
                          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeField(idx)} className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {data.formFields.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center">
                      <p className="text-sm text-muted-foreground">No fields yet. Add fields to build the form.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 4 (or 2 for client-side): Settings ── */}
            {((step === 4 && data.type === "ai") || (step === 2 && data.type === "client-side")) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Settings</h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Credit Cost</label>
                    <input type="number" min={0} value={data.creditCost} onChange={e => set("creditCost", Number(e.target.value))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Required Plan</label>
                    <select value={data.requiredPlan} onChange={e => set("requiredPlan", e.target.value)} className={inp}>
                      {["free", "lite", "pro", "business"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Daily Limit (0=∞)</label>
                    <input type="number" min={0} value={data.dailyLimit} onChange={e => set("dailyLimit", Number(e.target.value))} className={inp} />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {(["isActive", "isVisible"] as const).map(field => (
                    <div key={field} className="flex items-center gap-2">
                      <button
                        onClick={() => set(field, !data[field])}
                        className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors", data[field] ? "bg-primary" : "bg-muted")}
                      >
                        <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform", data[field] ? "translate-x-4" : "translate-x-0")} />
                      </button>
                      <span className="text-sm text-foreground capitalize">{field === "isActive" ? "Active" : "Visible"}</span>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Summary</p>
                  {[
                    ["Tool", data.name || "—"],
                    ["Kit", data.kitSlug || "—"],
                    ["Type", data.type],
                    ...(data.type === "ai" ? [["Model", data.aiModel], ["Fields", String(data.formFields.length)]] : []),
                    ["Credits", String(data.creditCost)],
                    ["Plan", data.requiredPlan],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground font-medium">{v}</span>
                    </div>
                  ))}
                </div>

                {err && <p className="text-xs text-destructive">{err}</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-border shrink-0">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {step > 1 ? "Back" : "Cancel"}
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => { setErr(""); setStep(s => s + 1); }}
                disabled={!data.name || !data.kitSlug}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isNew ? "Create Tool" : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>

      {fieldModal !== false && (
        <FieldEditor
          field={editFieldIdx !== null ? data.formFields[editFieldIdx] : {}}
          onSave={addOrUpdateField}
          onClose={() => { setFieldModal(false); setEditFieldIdx(null); }}
        />
      )}
    </>
  );
}
