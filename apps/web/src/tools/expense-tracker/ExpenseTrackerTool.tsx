"use client";

import { useState, useMemo } from "react";
import { Wallet, Plus, Trash2, Printer } from "lucide-react";
import { expenseTrackerConfig } from "./config";
import { fmtInr } from "@/lib/utils";
import { printDocument } from "@/lib/print-pdf";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: string;
  paymentMode: string;
}

const CATEGORIES = ["Food", "Travel", "Office", "Marketing", "Utilities", "Salary", "Rent", "Miscellaneous"] as const;
const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500/15 text-orange-400",
  Travel: "bg-blue-500/15 text-blue-400",
  Office: "bg-purple-500/15 text-purple-400",
  Marketing: "bg-pink-500/15 text-pink-400",
  Utilities: "bg-yellow-500/15 text-yellow-500",
  Salary: "bg-green-500/15 text-green-400",
  Rent: "bg-red-500/15 text-red-400",
  Miscellaneous: "bg-gray-500/15 text-gray-400",
};

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition";

export default function ExpenseTrackerTool({ creditCost: _c }: { creditCost?: number }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    date: today(), category: "Office", description: "", amount: "", paymentMode: "UPI",
  });
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const updateForm = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const addExpense = () => {
    if (!form.description || !form.amount) return;
    setExpenses(prev => [
      { id: crypto.randomUUID(), ...form },
      ...prev,
    ]);
    setForm(p => ({ ...p, description: "", amount: "" }));
  };

  const removeExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filterCategory !== "All" && e.category !== filterCategory) return false;
      if (filterFrom && e.date < filterFrom) return false;
      if (filterTo && e.date > filterTo) return false;
      return true;
    });
  }, [expenses, filterCategory, filterFrom, filterTo]);

  const total = filtered.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const thisMonth = useMemo(() => {
    const m = new Date().toISOString().slice(0, 7);
    return expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + (parseFloat(e.amount) || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [expenses]);

  const handleExport = () => {
    const rows = filtered.map(e => `<tr>
      <td>${e.date}</td>
      <td>${e.category}</td>
      <td>${e.description}</td>
      <td class="text-right">₹${fmtInr(parseFloat(e.amount) || 0)}</td>
      <td>${e.paymentMode}</td>
    </tr>`).join("");

    const html = `
      <h2 style="margin-bottom:16px;font-size:18px;font-weight:700">Expense Report</h2>
      <div style="margin-bottom:16px;font-size:11px;color:#666">Generated: ${new Date().toLocaleDateString("en-IN")}</div>
      <table style="margin-bottom:16px">
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th class="text-right">Amount</th><th>Mode</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:right;font-weight:700;font-size:14px">Total: ₹${fmtInr(total)}</div>
    `;
    printDocument(html, "Expense Report");
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Wallet className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{expenseTrackerConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">FREE</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{expenseTrackerConfig.description}</p>
          </div>
        </div>

        {/* Add Expense */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Add Expense</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Date</label>
              <input type="date" className={inputCls} value={form.date} onChange={e => updateForm("date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
              <select className={inputCls} value={form.category} onChange={e => updateForm("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Description <span className="text-destructive">*</span></label>
            <input className={inputCls} placeholder="What was this expense for?" value={form.description} onChange={e => updateForm("description", e.target.value)} onKeyDown={e => e.key === "Enter" && addExpense()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Amount (₹) <span className="text-destructive">*</span></label>
              <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00" value={form.amount} onChange={e => updateForm("amount", e.target.value)} onKeyDown={e => e.key === "Enter" && addExpense()} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Payment Mode</label>
              <select className={inputCls} value={form.paymentMode} onChange={e => updateForm("paymentMode", e.target.value)}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <button type="button" onClick={addExpense} className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </section>

        {/* Filters */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Filters</h2>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
            <select className={inputCls} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">From</label>
              <input type="date" className={inputCls} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">To</label>
              <input type="date" className={inputCls} value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </div>
          </div>
          {(filterCategory !== "All" || filterFrom || filterTo) && (
            <button type="button" onClick={() => { setFilterCategory("All"); setFilterFrom(""); setFilterTo(""); }} className="text-xs text-accent hover:underline">
              Clear filters
            </button>
          )}
        </section>
      </div>

      {/* RIGHT */}
      <div className="lg:w-[55%] p-4 md:p-6 flex flex-col gap-4 overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-muted-foreground mb-1">Total Expenses</div>
            <div className="text-lg font-bold text-red-400">₹{fmtInr(total)}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-muted-foreground mb-1">This Month</div>
            <div className="text-lg font-bold text-accent">₹{fmtInr(thisMonth)}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-muted-foreground mb-1">Top Category</div>
            <div className="text-base font-bold text-foreground truncate">{topCategory}</div>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 text-center p-8">
            <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Add your first expense</p>
            <p className="text-xs text-muted-foreground mt-1">Use the form on the left</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{filtered.length} expense{filtered.length !== 1 ? "s" : ""}</span>
              <button type="button" onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Printer className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr key={e.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-surface/30"}`}>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{e.date}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[e.category] ?? "bg-gray-500/15 text-gray-400"}`}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-foreground">{e.description}</td>
                      <td className="px-3 py-2 text-right font-medium text-foreground">₹{fmtInr(parseFloat(e.amount) || 0)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.paymentMode}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeExpense(e.id)} className="text-muted-foreground hover:text-destructive transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-surface">
                    <td colSpan={3} className="px-3 py-2 font-semibold text-foreground text-xs">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-foreground">₹{fmtInr(total)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
