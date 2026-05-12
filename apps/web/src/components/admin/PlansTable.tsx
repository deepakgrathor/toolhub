"use client";

import { useState } from "react";
import { Pencil, Loader2, X, Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface PlanFeatureRow {
  text: string;
  included: boolean;
  highlight: boolean;
}

export interface PlanRow {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  type: "free" | "credit" | "enterprise";
  isActive: boolean;
  isPopular: boolean;
  order: number;
  monthlyBase: number;
  monthlyBaseCredits: number;
  monthlyPricePerCredit: number;
  monthlyMaxCredits: number;
  yearlyBase: number;
  yearlyBaseCredits: number;
  yearlyPricePerCredit: number;
  yearlyDiscountPercent: number;
  features: PlanFeatureRow[];
}

interface EditState {
  name: string;
  tagline: string;
  isActive: boolean;
  isPopular: boolean;
  monthlyBase: string;
  monthlyBaseCredits: string;
  monthlyPricePerCredit: string;
  monthlyMaxCredits: string;
  yearlyBase: string;
  yearlyBaseCredits: string;
  yearlyPricePerCredit: string;
  yearlyDiscountPercent: string;
  features: PlanFeatureRow[];
}

function planToEdit(p: PlanRow): EditState {
  return {
    name: p.name,
    tagline: p.tagline,
    isActive: p.isActive,
    isPopular: p.isPopular,
    monthlyBase: String(p.monthlyBase),
    monthlyBaseCredits: String(p.monthlyBaseCredits),
    monthlyPricePerCredit: String(p.monthlyPricePerCredit),
    monthlyMaxCredits: String(p.monthlyMaxCredits),
    yearlyBase: String(p.yearlyBase),
    yearlyBaseCredits: String(p.yearlyBaseCredits),
    yearlyPricePerCredit: String(p.yearlyPricePerCredit),
    yearlyDiscountPercent: String(p.yearlyDiscountPercent),
    features: p.features.map((f) => ({ ...f })),
  };
}

function Toggle({
  value,
  onChange,
  color = "bg-[#7c3aed]",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        value ? color : "bg-muted/40"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          value ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
      />
    </div>
  );
}

export function PlansTable({ initialPlans }: { initialPlans: PlanRow[] }) {
  const [plans, setPlans] = useState<PlanRow[]>(initialPlans);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openEdit(plan: PlanRow) {
    setEditingSlug(plan.slug);
    setForm(planToEdit(plan));
    setError("");
  }

  function closeModal() {
    setEditingSlug(null);
    setForm(null);
    setError("");
  }

  function setField<K extends keyof EditState>(key: K, value: EditState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function updateFeature(i: number, patch: Partial<PlanFeatureRow>) {
    setForm((f) => {
      if (!f) return f;
      const features = f.features.map((feat, idx) =>
        idx === i ? { ...feat, ...patch } : feat
      );
      return { ...f, features };
    });
  }

  function removeFeature(i: number) {
    setForm((f) => {
      if (!f) return f;
      return { ...f, features: f.features.filter((_, idx) => idx !== i) };
    });
  }

  function addFeature() {
    setForm((f) => {
      if (!f) return f;
      return {
        ...f,
        features: [...f.features, { text: "", included: true, highlight: false }],
      };
    });
  }

  async function handleSave() {
    if (!editingSlug || !form) return;
    setError("");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      isActive: form.isActive,
      isPopular: form.isPopular,
      pricing: {
        monthly: {
          basePrice: parseFloat(form.monthlyBase) || 0,
          baseCredits: parseInt(form.monthlyBaseCredits, 10) || 0,
          pricePerCredit: parseFloat(form.monthlyPricePerCredit) || 0,
          maxCredits: parseInt(form.monthlyMaxCredits, 10) || 0,
        },
        yearly: {
          basePrice: parseFloat(form.yearlyBase) || 0,
          baseCredits: parseInt(form.yearlyBaseCredits, 10) || 0,
          pricePerCredit: parseFloat(form.yearlyPricePerCredit) || 0,
          discountPercent: parseInt(form.yearlyDiscountPercent, 10) || 30,
        },
      },
      features: form.features.filter((f) => f.text.trim()),
    };

    try {
      const res = await fetch(`/api/admin/plans/${editingSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save plan.");
      setPlans((prev) =>
        prev.map((p) =>
          p.slug === editingSlug
            ? {
                ...p,
                name: payload.name,
                tagline: payload.tagline,
                isActive: payload.isActive,
                isPopular: payload.isPopular,
                monthlyBase: payload.pricing.monthly.basePrice,
                monthlyBaseCredits: payload.pricing.monthly.baseCredits,
                monthlyPricePerCredit: payload.pricing.monthly.pricePerCredit,
                monthlyMaxCredits: payload.pricing.monthly.maxCredits,
                yearlyBase: payload.pricing.yearly.basePrice,
                yearlyBaseCredits: payload.pricing.yearly.baseCredits,
                yearlyPricePerCredit: payload.pricing.yearly.pricePerCredit,
                yearlyDiscountPercent: payload.pricing.yearly.discountPercent,
                features: payload.features,
              }
            : p
        )
      );
      closeModal();
      toast.success("Plan saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    free: "bg-[#10b981]/10 text-[#10b981]",
    credit: "bg-[#7c3aed]/10 text-[#7c3aed]",
    enterprise: "bg-amber-400/10 text-amber-400",
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {plans.length} plans — click a row to edit
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#111]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Base</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Yearly Base</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    {plan.name}
                    {plan.isPopular && (
                      <span className="rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{plan.tagline}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", TYPE_COLORS[plan.type] ?? "")}>
                    {plan.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {plan.type === "free" ? "₹0" : plan.type === "enterprise" ? "—" : `₹${plan.monthlyBase}`}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {plan.type === "free" ? "₹0" : plan.type === "enterprise" ? "—" : `₹${plan.yearlyBase}`}
                </td>
                <td className="px-4 py-3 text-center">
                  {plan.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/15 px-2 py-0.5 text-xs font-medium text-[#10b981]">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">Off</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(plan)}
                    className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingSlug && form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-[#111] shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Edit Plan — {plans.find((p) => p.slug === editingSlug)?.name}
              </h2>
              <button onClick={closeModal} className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {error && (
                <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              {/* Basic */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>
                <Input label="Name" value={form.name} onChange={(v) => setField("name", v)} />
                <Input label="Tagline" value={form.tagline} onChange={(v) => setField("tagline", v)} />
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <Toggle value={form.isActive} onChange={(v) => setField("isActive", v)} color="bg-[#10b981]" />
                    <span className="text-sm text-foreground">Active</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <Toggle value={form.isPopular} onChange={(v) => setField("isPopular", v)} color="bg-amber-400" />
                    <span className="text-sm text-foreground">Popular (Best Value badge)</span>
                  </label>
                </div>
              </div>

              {/* Monthly pricing */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monthly Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Base Price (₹/mo)" type="number" value={form.monthlyBase} onChange={(v) => setField("monthlyBase", v)} placeholder="299" />
                  <Input label="Base Credits" type="number" value={form.monthlyBaseCredits} onChange={(v) => setField("monthlyBaseCredits", v)} placeholder="100" />
                  <Input label="₹/Extra Credit" type="number" value={form.monthlyPricePerCredit} onChange={(v) => setField("monthlyPricePerCredit", v)} placeholder="2.50" />
                  <Input label="Max Credits" type="number" value={form.monthlyMaxCredits} onChange={(v) => setField("monthlyMaxCredits", v)} placeholder="500" />
                </div>
              </div>

              {/* Yearly pricing */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Yearly Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Base Price (₹/yr)" type="number" value={form.yearlyBase} onChange={(v) => setField("yearlyBase", v)} placeholder="2990" />
                  <Input label="Base Credits" type="number" value={form.yearlyBaseCredits} onChange={(v) => setField("yearlyBaseCredits", v)} placeholder="100" />
                  <Input label="₹/Extra Credit" type="number" value={form.yearlyPricePerCredit} onChange={(v) => setField("yearlyPricePerCredit", v)} placeholder="2.00" />
                  <Input label="Discount %" type="number" value={form.yearlyDiscountPercent} onChange={(v) => setField("yearlyDiscountPercent", v)} placeholder="30" />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Features</h3>
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat.text}
                        onChange={(e) => updateFeature(i, { text: e.target.value })}
                        placeholder="Feature text..."
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                      />
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feat.included}
                          onChange={(e) => updateFeature(i, { included: e.target.checked })}
                          className="accent-[#10b981]"
                        />
                        Incl.
                      </label>
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feat.highlight}
                          onChange={(e) => updateFeature(i, { highlight: e.target.checked })}
                          className="accent-[#7c3aed]"
                        />
                        Bold
                      </label>
                      <button
                        onClick={() => removeFeature(i)}
                        className="rounded p-1 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.features.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No features yet. Click Add.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-60 transition-colors">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
