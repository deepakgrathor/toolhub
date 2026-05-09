"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Star,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface PackRow {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  razorpayPlanId?: string;
}

interface FormState {
  name: string;
  credits: string;
  priceInr: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
  razorpayPlanId: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  credits: "",
  priceInr: "",
  isFeatured: false,
  isActive: true,
  sortOrder: "0",
  razorpayPlanId: "",
};

function packToForm(p: PackRow): FormState {
  return {
    name: p.name,
    credits: String(p.credits),
    priceInr: String(p.priceInr),
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    sortOrder: String(p.sortOrder),
    razorpayPlanId: p.razorpayPlanId ?? "",
  };
}

export function PricingTable({ initialPacks }: { initialPacks: PackRow[] }) {
  const [packs, setPacks] = useState<PackRow[]>(initialPacks);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PackRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Drag-to-reorder state
  const dragId = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(pack: PackRow) {
    setEditingId(pack.id);
    setForm(packToForm(pack));
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setError("");
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Save (create or update) ───────────────────────────────────────────────
  async function handleSave() {
    setError("");
    const credits = parseInt(form.credits, 10);
    const priceInr = parseFloat(form.priceInr);
    const sortOrder = parseInt(form.sortOrder, 10);

    if (!form.name.trim()) return setError("Pack name is required.");
    if (isNaN(credits) || credits < 1) return setError("Credits must be ≥ 1.");
    if (isNaN(priceInr) || priceInr < 0) return setError("Price must be ≥ 0.");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        credits,
        priceInr,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
        ...(form.razorpayPlanId.trim()
          ? { razorpayPlanId: form.razorpayPlanId.trim() }
          : {}),
      };

      if (editingId) {
        const res = await fetch(`/api/admin/pricing/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update pack.");
        setPacks((prev) =>
          prev.map((p) =>
            p.id === editingId ? { ...p, ...payload } : p
          )
        );
      } else {
        const res = await fetch("/api/admin/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create pack.");
        const data = await res.json();
        const newPack: PackRow = {
          id: data.pack._id,
          ...payload,
        };
        setPacks((prev) => [...prev, newPack]);
      }
      closeModal();
      toast.success("Pack saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/pricing/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      setPacks((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep dialog open — user will see nothing changed
    } finally {
      setDeleting(false);
    }
  }

  // ── Drag reorder ─────────────────────────────────────────────────────────
  function onDragStart(id: string) {
    dragId.current = id;
  }

  function onDragEnter(id: string) {
    dragOver.current = id;
  }

  function onDragEnd() {
    if (!dragId.current || !dragOver.current || dragId.current === dragOver.current) {
      dragId.current = null;
      dragOver.current = null;
      return;
    }

    const reordered = [...packs];
    const fromIdx = reordered.findIndex((p) => p.id === dragId.current);
    const toIdx = reordered.findIndex((p) => p.id === dragOver.current);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Update sortOrder to match new positions and persist each change
    const updated = reordered.map((p, i) => ({ ...p, sortOrder: i }));
    setPacks(updated);

    // Fire-and-forget PATCH for each re-ordered item
    updated.forEach((p) => {
      fetch(`/api/admin/pricing/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: p.sortOrder }),
      }).catch(() => {/* silent — order is cosmetic */});
    });

    dragId.current = null;
    dragOver.current = null;
  }

  const perCredit = (p: PackRow) =>
    p.credits > 0 ? (p.priceInr / p.credits).toFixed(2) : "—";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pricing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {packs.length} credit pack{packs.length !== 1 ? "s" : ""} — drag to
            reorder
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Pack
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#111]">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Credits
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price (₹)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ₹/Credit
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Featured
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Order
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Edit
              </th>
            </tr>
          </thead>
          <tbody>
            {packs.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No packs yet. Click "Add New Pack" to get started.
                </td>
              </tr>
            )}
            {packs.map((pack) => (
              <tr
                key={pack.id}
                draggable
                onDragStart={() => onDragStart(pack.id)}
                onDragEnter={() => onDragEnter(pack.id)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-grab active:cursor-grabbing"
              >
                {/* Drag handle */}
                <td className="px-3 py-3 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </td>

                {/* Name */}
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {pack.name}
                    {pack.isFeatured && (
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </td>

                {/* Credits */}
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {pack.credits.toLocaleString()}
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  ₹{pack.priceInr.toLocaleString()}
                </td>

                {/* Per-credit cost */}
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  ₹{perCredit(pack)}
                </td>

                {/* Featured badge */}
                <td className="px-4 py-3 text-center">
                  {pack.isFeatured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                      <Star className="h-3 w-3 fill-yellow-400" /> Yes
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>

                {/* Active badge */}
                <td className="px-4 py-3 text-center">
                  {pack.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/15 px-2 py-0.5 text-xs font-medium text-[#10b981]">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Off
                    </span>
                  )}
                </td>

                {/* Sort order */}
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {pack.sortOrder}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(pack)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(pack)}
                      className="rounded p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#111] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {editingId ? "Edit Pack" : "Add New Pack"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {error && (
                <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Pack Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Starter Pack"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>

              {/* Credits + Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.credits}
                    onChange={(e) => setField("credits", e.target.value)}
                    placeholder="50"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.priceInr}
                    onChange={(e) => setField("priceInr", e.target.value)}
                    placeholder="99"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  />
                </div>
              </div>

              {/* Sort Order + Razorpay Plan ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setField("sortOrder", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Razorpay Plan ID
                  </label>
                  <input
                    type="text"
                    value={form.razorpayPlanId}
                    onChange={(e) => setField("razorpayPlanId", e.target.value)}
                    placeholder="plan_..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isFeatured}
                    onClick={() => setField("isFeatured", !form.isFeatured)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      form.isFeatured ? "bg-[#7c3aed]" : "bg-muted/40"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        form.isFeatured ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <span className="text-sm text-foreground">Featured</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() => setField("isActive", !form.isActive)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      form.isActive ? "bg-[#10b981]" : "bg-muted/40"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        form.isActive ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <span className="text-sm text-foreground">Active</span>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-60 transition-colors"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Save Changes" : "Create Pack"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-[#111] shadow-2xl">
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-foreground mb-2">
                Delete pack?
              </h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {deleteTarget.name}
                </span>{" "}
                will be permanently removed. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
