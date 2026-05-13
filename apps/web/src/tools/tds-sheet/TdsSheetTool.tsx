"use client";

import { useState, useMemo } from "react";
import { Table2, Plus, Trash2, Printer } from "lucide-react";
import { tdsSheetConfig } from "./config";
import { fmtInr } from "@/lib/utils";
import { printDocument } from "@/lib/print-pdf";

interface TdsEntry {
  id: string;
  vendorName: string;
  pan: string;
  paymentNature: string;
  tdsSection: string;
  paymentAmount: string;
  tdsRate: string;
  tdsAmount: string;
  paymentDate: string;
}

const TDS_SECTIONS: Record<string, { label: string; rate: string }> = {
  "194A": { label: "194A — Interest", rate: "10" },
  "194C(1)": { label: "194C(1) — Contractor (Individual)", rate: "1" },
  "194C(2)": { label: "194C(2) — Contractor (Company)", rate: "2" },
  "194H": { label: "194H — Commission / Brokerage", rate: "5" },
  "194I(a)": { label: "194I(a) — Rent (Plant & Machinery)", rate: "2" },
  "194I(b)": { label: "194I(b) — Rent (Land/Building)", rate: "10" },
  "194J": { label: "194J — Professional / Technical Fee", rate: "10" },
  "194Q": { label: "194Q — Purchase of Goods", rate: "0.1" },
};

const QUARTERS = ["Q1 (Apr–Jun)", "Q2 (Jul–Sep)", "Q3 (Oct–Dec)", "Q4 (Jan–Mar)"] as const;
const currentFY = () => {
  const now = new Date();
  const yr = now.getFullYear();
  return now.getMonth() >= 3 ? `${yr}-${String(yr + 1).slice(-2)}` : `${yr - 1}-${String(yr).slice(-2)}`;
};

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function newEntry(): TdsEntry {
  return {
    id: crypto.randomUUID(), vendorName: "", pan: "", paymentNature: "",
    tdsSection: "194J", paymentAmount: "", tdsRate: "10", tdsAmount: "", paymentDate: today(),
  };
}

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function TdsSheetTool({ creditCost: _c }: { creditCost?: number }) {
  const [entries, setEntries] = useState<TdsEntry[]>([]);
  const [form, setForm] = useState<TdsEntry>(newEntry());
  const [quarter, setQuarter] = useState<string>(QUARTERS[0]);
  const [fy, setFy] = useState(currentFY());

  const updateForm = (k: keyof TdsEntry, v: string) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === "tdsSection") {
        next.tdsRate = TDS_SECTIONS[v]?.rate ?? prev.tdsRate;
      }
      if (k === "paymentAmount" || k === "tdsRate" || k === "tdsSection") {
        const amt = parseFloat(k === "paymentAmount" ? v : next.paymentAmount) || 0;
        const rate = parseFloat(k === "tdsRate" ? v : next.tdsRate) || 0;
        next.tdsAmount = (amt * rate / 100).toFixed(2);
      }
      return next;
    });
  };

  const addEntry = () => {
    if (!form.vendorName || !form.paymentAmount) return;
    setEntries(prev => [...prev, { ...form }]);
    setForm({ ...newEntry() });
  };

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  const totals = useMemo(() => ({
    payments: entries.reduce((s, e) => s + (parseFloat(e.paymentAmount) || 0), 0),
    tds: entries.reduce((s, e) => s + (parseFloat(e.tdsAmount) || 0), 0),
  }), [entries]);

  const handleExport = () => {
    const rows = entries.map(e => `<tr>
      <td>${e.vendorName}</td><td>${e.pan}</td><td>${e.paymentNature}</td>
      <td class="text-right">₹${fmtInr(parseFloat(e.paymentAmount) || 0)}</td>
      <td>${e.tdsSection}</td><td class="text-right">${e.tdsRate}%</td>
      <td class="text-right">₹${fmtInr(parseFloat(e.tdsAmount) || 0)}</td>
      <td>${e.paymentDate}</td>
    </tr>`).join("");

    const html = `
      <h2 style="margin-bottom:4px;font-size:18px;font-weight:700">TDS Deduction Sheet</h2>
      <div style="font-size:11px;color:#666;margin-bottom:16px">FY ${fy} | ${quarter}</div>
      <table style="margin-bottom:16px">
        <thead><tr><th>Vendor</th><th>PAN</th><th>Nature</th><th class="text-right">Amount</th><th>Section</th><th class="text-right">Rate%</th><th class="text-right">TDS</th><th>Date</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f5f5f5;font-weight:700">
            <td colspan="3">Total</td>
            <td class="text-right">₹${fmtInr(totals.payments)}</td>
            <td colspan="2"></td>
            <td class="text-right">₹${fmtInr(totals.tds)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div style="font-size:11px;margin-top:8px">
        <div>Total Payments: <strong>₹${fmtInr(totals.payments)}</strong></div>
        <div>Total TDS Deducted: <strong>₹${fmtInr(totals.tds)}</strong></div>
        <div>Balance Payable to Govt: <strong>₹${fmtInr(totals.tds)}</strong></div>
      </div>
    `;
    printDocument(html, `TDS Sheet — FY ${fy} ${quarter}`);
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Table2 className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{tdsSheetConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">FREE</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{tdsSheetConfig.description}</p>
          </div>
        </div>

        {/* Quarter */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Financial Period</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quarter">
              <select className={inputCls} value={quarter} onChange={e => setQuarter(e.target.value)}>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </Field>
            <Field label="Financial Year">
              <input className={inputCls} placeholder="2025-26" value={fy} onChange={e => setFy(e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Add Entry */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Add Entry</h2>
          <Field label="Vendor / Payee Name"><input className={inputCls} placeholder="ABC Consultants" value={form.vendorName} onChange={e => updateForm("vendorName", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PAN"><input className={inputCls} placeholder="AAAAA0000A" value={form.pan} onChange={e => updateForm("pan", e.target.value.toUpperCase())} maxLength={10} /></Field>
            <Field label="Nature of Payment"><input className={inputCls} placeholder="Consulting fee" value={form.paymentNature} onChange={e => updateForm("paymentNature", e.target.value)} /></Field>
          </div>
          <Field label="TDS Section">
            <select className={inputCls} value={form.tdsSection} onChange={e => updateForm("tdsSection", e.target.value)}>
              {Object.entries(TDS_SECTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Payment Amount (₹)"><input className={inputCls} type="number" min="0" step="0.01" placeholder="0" value={form.paymentAmount} onChange={e => updateForm("paymentAmount", e.target.value)} /></Field>
            <Field label="TDS Rate (%)"><input className={inputCls} type="number" min="0" step="0.01" value={form.tdsRate} onChange={e => updateForm("tdsRate", e.target.value)} /></Field>
          </div>
          <div className="flex justify-between rounded-lg bg-accent/10 px-3 py-2 text-sm">
            <span className="text-muted-foreground text-xs font-medium">TDS Amount</span>
            <span className="font-semibold text-accent">₹{fmtInr(parseFloat(form.tdsAmount) || 0)}</span>
          </div>
          <Field label="Payment Date"><input className={inputCls} type="date" value={form.paymentDate} onChange={e => updateForm("paymentDate", e.target.value)} /></Field>
          <button type="button" onClick={addEntry} className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
            <Plus className="h-4 w-4" />Add Entry
          </button>
        </section>
      </div>

      {/* RIGHT */}
      <div className="lg:w-[55%] p-4 md:p-6 flex flex-col gap-4 overflow-y-auto">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-muted-foreground mb-1">Total Payments</div>
            <div className="text-base font-bold text-foreground">₹{fmtInr(totals.payments)}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-muted-foreground mb-1">TDS Deducted</div>
            <div className="text-base font-bold text-red-400">₹{fmtInr(totals.tds)}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-muted-foreground mb-1">Payable to Govt</div>
            <div className="text-base font-bold text-accent">₹{fmtInr(totals.tds)}</div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 text-center p-8">
            <Table2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Add your first TDS entry</p>
            <p className="text-xs text-muted-foreground mt-1">Use the form on the left</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{entries.length} entr{entries.length !== 1 ? "ies" : "y"} — FY {fy} | {quarter}</span>
              <button type="button" onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                <Printer className="h-3.5 w-3.5" />Export PDF
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Vendor</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">PAN</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Section</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Rate%</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">TDS</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-surface/30"}`}>
                      <td className="px-3 py-2 font-medium text-foreground">{e.vendorName}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{e.pan}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium">{e.tdsSection}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">₹{fmtInr(parseFloat(e.paymentAmount) || 0)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{e.tdsRate}%</td>
                      <td className="px-3 py-2 text-right font-semibold text-red-400">₹{fmtInr(parseFloat(e.tdsAmount) || 0)}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{e.paymentDate}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeEntry(e.id)} className="text-muted-foreground hover:text-destructive transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-surface">
                    <td colSpan={3} className="px-3 py-2 font-semibold text-foreground">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-foreground">₹{fmtInr(totals.payments)}</td>
                    <td />
                    <td className="px-3 py-2 text-right font-bold text-red-400">₹{fmtInr(totals.tds)}</td>
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
