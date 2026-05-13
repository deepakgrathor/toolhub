"use client";

import { useState, useEffect } from "react";
import {
  ChevronUp, ChevronDown, Plus, Pencil, Eye, EyeOff,
  LayoutGrid, Loader2, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KitRow {
  _id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  showInOnboarding: boolean;
  onboardingLabel: string;
  onboardingDescription: string;
  onboardingIcon: string;
  toolCount?: number;
}

const EMPTY_KIT: Omit<KitRow, "_id" | "toolCount"> = {
  slug: "", name: "", description: "", icon: "LayoutGrid",
  color: "#7c3aed", order: 0, isActive: true,
  showInOnboarding: true, onboardingLabel: "",
  onboardingDescription: "", onboardingIcon: "LayoutGrid",
};

// ── Kit Modal ─────────────────────────────────────────────────────────────────

function KitModal({
  kit,
  onClose,
  onSave,
}: {
  kit: Partial<KitRow> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = !kit?._id;
  const [form, setForm] = useState<Omit<KitRow, "_id" | "toolCount">>(
    kit ? { ...EMPTY_KIT, ...kit } : { ...EMPTY_KIT }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      setErr("Name and slug are required");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const url  = isNew ? "/api/admin/kits" : `/api/admin/kits/${kit!.slug}`;
      const method = isNew ? "POST" : "PATCH";
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setErr(data.error ?? "Save failed"); return; }
      onSave();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isNew ? "Add New Kit" : `Edit Kit — ${kit?.slug}`}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Kit Name *</label>
              <input
                value={form.name}
                onChange={e => {
                  set("name", e.target.value);
                  if (isNew) set("slug", autoSlug(e.target.value));
                }}
                placeholder="e.g. Creator Kit"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={e => set("slug", e.target.value)}
                placeholder="e.g. creator"
                disabled={!isNew}
                className={cn(inp, !isNew && "opacity-60 cursor-not-allowed")}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={2}
              className={cn(inp, "resize-none")}
              placeholder="Short description of this kit"
            />
          </div>

          {/* Icon + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Icon (Lucide name)</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.icon}
                  onChange={e => set("icon", e.target.value)}
                  placeholder="e.g. Video"
                  className={inp}
                />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <DynamicIcon name={form.icon} size={18} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.color}
                  onChange={e => set("color", e.target.value)}
                  placeholder="#7c3aed"
                  className={inp}
                />
                <div
                  className="h-9 w-9 shrink-0 rounded-lg border border-border"
                  style={{ backgroundColor: form.color }}
                />
              </div>
            </div>
          </div>

          {/* Order + IsActive */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={e => set("order", Number(e.target.value))}
                className={inp}
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <button
                onClick={() => set("isActive", !form.isActive)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  form.isActive ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
                  form.isActive ? "translate-x-4" : "translate-x-0"
                )} />
              </button>
              <span className="text-sm text-foreground">Active</span>
            </div>
          </div>

          {/* Onboarding section */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => set("showInOnboarding", !form.showInOnboarding)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  form.showInOnboarding ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
                  form.showInOnboarding ? "translate-x-4" : "translate-x-0"
                )} />
              </button>
              <span className="text-sm font-medium text-foreground">Show in Onboarding</span>
            </div>

            {form.showInOnboarding && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Onboarding Label</label>
                    <input
                      value={form.onboardingLabel}
                      onChange={e => set("onboardingLabel", e.target.value)}
                      placeholder="e.g. Content Creator"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Onboarding Icon</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={form.onboardingIcon}
                        onChange={e => set("onboardingIcon", e.target.value)}
                        placeholder="e.g. Video"
                        className={inp}
                      />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <DynamicIcon name={form.onboardingIcon} size={16} />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Onboarding Description</label>
                  <input
                    value={form.onboardingDescription}
                    onChange={e => set("onboardingDescription", e.target.value)}
                    placeholder="e.g. Bloggers, YouTubers, Influencers"
                    className={inp}
                  />
                </div>
              </div>
            )}
          </div>

          {err && (
            <p className="text-xs text-destructive">{err}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isNew ? "Create Kit" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminKitsPage() {
  const [kits, setKits]       = useState<KitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<Partial<KitRow> | null | false>(false);
  const [saving, setSaving]   = useState<string | null>(null);

  async function loadKits() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/kits");
      const data = await res.json() as { kits?: KitRow[] };
      setKits(data.kits ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadKits(); }, []);

  async function toggleActive(kit: KitRow) {
    setSaving(kit.slug);
    await fetch(`/api/admin/kits/${kit.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !kit.isActive }),
    });
    setSaving(null);
    await loadKits();
  }

  async function moveOrder(kit: KitRow, direction: "up" | "down") {
    const idx = kits.findIndex(k => k.slug === kit.slug);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === kits.length - 1) return;

    const newKits = [...kits];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newKits[idx], newKits[swapIdx]] = [newKits[swapIdx], newKits[idx]];

    const order = newKits.map((k, i) => ({ slug: k.slug, order: i + 1 }));
    await fetch("/api/admin/kits/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    await loadKits();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Kit Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {kits.length} kits — drag to reorder, toggle visibility
          </p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add New Kit
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {kits.map((kit, idx) => (
            <div
              key={kit.slug}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-opacity",
                !kit.isActive && "opacity-50"
              )}
            >
              {/* Order arrows */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveOrder(kit, "up")}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveOrder(kit, "down")}
                  disabled={idx === kits.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Icon */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                style={{ backgroundColor: `${kit.color}20` }}
              >
                <DynamicIcon name={kit.icon} size={18} className="text-foreground" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{kit.name}</span>
                  <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    {kit.slug}
                  </span>
                  {!kit.isActive && (
                    <span className="text-xs text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kit.toolCount ?? 0} tools
                  {kit.showInOnboarding && (
                    <span className="ml-2 text-success">· Visible in onboarding</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setModal(kit)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => toggleActive(kit)}
                  disabled={saving === kit.slug}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  {saving === kit.slug ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : kit.isActive ? (
                    <><EyeOff className="h-3 w-3" /> Hide</>
                  ) : (
                    <><Eye className="h-3 w-3" /> Show</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== false && (
        <KitModal
          kit={modal}
          onClose={() => setModal(false)}
          onSave={async () => { setModal(false); await loadKits(); }}
        />
      )}
    </div>
  );
}
