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
  price: number;
  pricePerCredit: number;
  isPopular: boolean;
  isActive: boolean;
  order: number;
}

interface FormState {
  name: string;
  credits: string;
  price: string;
  pricePerCredit: string;
  isPopular: boolean;
  isActive: boolean;
  order: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  credits: "",
  price: "",
  pricePerCredit: "",
  isPopular: false,
  isActive: true,
  order: "0",
};

function packToForm(p: PackRow): FormState {
  return {
    name: p.name,
    credits: String(p.credits),
    price: String(p.price),
    pricePerCredit: String(p.pricePerCredit),
    isPopular: p.isPopular,
    isActive: p.isActive,
    order: String(p.order),
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

  const dragId = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);

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

  async function handleSave() {
    setError("");
    const credits = parseInt(form.credits, 10);
    const price = parseFloat(form.price);
    const order = parseInt(form.order, 10);
    const pricePerCredit =
      form.pricePerCredit.trim()
        ? parseFloat(form.pricePerCredit)
        : credits > 0
        ? parseFloat((price / credits).toFixed(2))
        : 0;

    if (!form.name.trim()) return setError("Pack name is required.");
    if (isNaN(credits) || credits < 1) return setError("Credits must be ≥ 1.");
    if (isNaN(price) || price < 0) return setError("Price must be ≥ 0.");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        credits,
        price,
        pricePerCredit,
        isPopular: form.isPopular,
        isActive: form.isActive,
        order: isNaN(order) ? 0 : order,
      };

      const url = editingId
        ? `/api/admin/credit-packs/${editingId}`
        : "/api/admin/credit-packs";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save pack.");

      if (editingId) {
        setPacks((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p))
        );
      } else {
        const data = await res.json();
        const newPack: PackRow = { id: data.pack._id, ...payload };
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/credit-packs/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      setPacks((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep dialog open
    } finally {
      setDeleting(false);
    }
  }

  function onDragStart(id: string) { dragId.current = id; }
  function onDragEnter(id: string) { dragOver.current = id; }

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

    const updated = reordered.map((p, i) => ({ ...p, order: i }));
    setPacks(updated);

    updated.forEach((p) => {
      fetch(`/api/admin/credit-packs/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: p.order }),
      }).catch(() => {});
    });

    dragId.current = null;
    dragOver.current = null;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Credit Packs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {packs.length} pack{packs.length !== 1 ? "s" : ""} — drag to reorder
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Pack
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#111]">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credits</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price (₹)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">₹/Credit</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Popular</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit</th>
            </tr>
          </thead>
          <tbody>
            {packs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No packs yet. Click "Add Pack" to get started.
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
                <td className="px-3 py-3 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {pack.name}
                    {pack.isPopular && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">{(pack.credits ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">₹{(pack.price ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">₹{(pack.pricePerCredit ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  {pack.isPopular ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                      <Star className="h-3 w-3 fill-yellow-400" /> Yes
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {pack.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/15 px-2 py-0.5 text-xs font-medium text-[#10b981]">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">Off</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{pack.order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(pack)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(pack)} className="rounded p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {editingId ? "Edit Pack" : "Add New Pack"}
              </h2>
              <button onClick={closeModal} className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pack Name</label>
                <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Starter Pack" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Credits</label>
                  <input type="number" min={1} value={form.credits} onChange={(e) => setField("credits", e.target.value)} placeholder="100" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price (₹)</label>
                  <input type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="149" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">₹/Credit (auto-calc if empty)</label>
                  <input type="number" min={0} step="0.01" value={form.pricePerCredit} onChange={(e) => setField("pricePerCredit", e.target.value)} placeholder="auto" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sort Order</label>
                  <input type="number" min={0} value={form.order} onChange={(e) => setField("order", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <button type="button" role="switch" aria-checked={form.isPopular} onClick={() => setField("isPopular", !form.isPopular)} className={cn("relative h-5 w-9 rounded-full transition-colors", form.isPopular ? "bg-yellow-400" : "bg-muted/40")}>
                    <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", form.isPopular ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                  <span className="text-sm text-foreground">Popular</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <button type="button" role="switch" aria-checked={form.isActive} onClick={() => setField("isActive", !form.isActive)} className={cn("relative h-5 w-9 rounded-full transition-colors", form.isActive ? "bg-[#10b981]" : "bg-muted/40")}>
                    <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", form.isActive ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                  <span className="text-sm text-foreground">Active</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-60 transition-colors">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Save Changes" : "Create Pack"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-[#111] shadow-2xl">
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-foreground mb-2">Delete pack?</h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{deleteTarget.name}</span>{" "}
                will be permanently removed. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
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
