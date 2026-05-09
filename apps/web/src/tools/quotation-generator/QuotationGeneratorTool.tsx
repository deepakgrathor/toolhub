"use client";

import { useState, useCallback } from "react";
import { ClipboardList, Plus, Trash2, Download, RotateCcw, Info } from "lucide-react";
import { quotationGeneratorConfig } from "./config";
import { amountToWords, fmtInr } from "@/lib/utils";
import { printDocument } from "@/lib/print-pdf";

interface Party {
  name: string;
  company: string;
  address: string;
  phone: string;
  email: string;
}

interface QuoteInfo {
  number: string;
  date: string;
  validUntil: string;
  notes: string;
  terms: string;
  discount: string;
}

interface LineItem {
  id: string;
  description: string;
  qty: string;
  unit: string;
  rate: string;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function validDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", qty: "1", unit: "Nos", rate: "" };
}

const DEFAULT_FROM: Party = { name: "", company: "", address: "", phone: "", email: "" };
const DEFAULT_TO: Party = { name: "", company: "", address: "", phone: "", email: "" };

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label} {required && <span className="text-destructive">*</span>}</label>
      {children}
    </div>
  );
}

export default function QuotationGeneratorTool({ creditCost: _c }: { creditCost?: number }) {
  const [from, setFrom] = useState<Party>({ ...DEFAULT_FROM });
  const [to, setTo] = useState<Party>({ ...DEFAULT_TO });
  const [quote, setQuote] = useState<QuoteInfo>({
    number: "QUO-001", date: today(), validUntil: validDate(),
    notes: "", terms: "Payment due within 15 days of acceptance.", discount: "0",
  });
  const [items, setItems] = useState<LineItem[]>([newItem()]);

  const updateFrom = (k: keyof Party, v: string) => setFrom(p => ({ ...p, [k]: v }));
  const updateTo = (k: keyof Party, v: string) => setTo(p => ({ ...p, [k]: v }));
  const updateQuote = (k: keyof QuoteInfo, v: string) => setQuote(p => ({ ...p, [k]: v }));
  const updateItem = (id: string, k: keyof LineItem, v: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i));
  const addItem = () => setItems(prev => [...prev, newItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const calcItemTotal = useCallback((item: LineItem) => (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0), []);

  const subtotal = items.reduce((s, i) => s + calcItemTotal(i), 0);
  const discount = Math.min(parseFloat(quote.discount) || 0, subtotal);
  const grandTotal = subtotal - discount;

  const handlePrint = () => {
    const html = generateQuoteHtml({ from, to, quote, items, calcItemTotal, subtotal, discount, grandTotal });
    printDocument(html, `Quotation ${quote.number}`);
  };

  const handleReset = () => {
    setFrom({ ...DEFAULT_FROM });
    setTo({ ...DEFAULT_TO });
    setQuote({ number: "QUO-001", date: today(), validUntil: validDate(), notes: "", terms: "Payment due within 15 days of acceptance.", discount: "0" });
    setItems([newItem()]);
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <ClipboardList className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{quotationGeneratorConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">FREE</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{quotationGeneratorConfig.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-400">Free tool — no login required. Login to save your work.</p>
        </div>

        {/* From */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">From (Your Details)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your Name" required><input className={inputCls} placeholder="Rahul Sharma" value={from.name} onChange={e => updateFrom("name", e.target.value)} /></Field>
            <Field label="Company"><input className={inputCls} placeholder="Your Company" value={from.company} onChange={e => updateFrom("company", e.target.value)} /></Field>
          </div>
          <Field label="Address"><textarea className={inputCls + " resize-none"} rows={2} value={from.address} onChange={e => updateFrom("address", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><input className={inputCls} placeholder="98XXXXXXXX" value={from.phone} onChange={e => updateFrom("phone", e.target.value)} /></Field>
            <Field label="Email"><input className={inputCls} type="email" placeholder="you@company.com" value={from.email} onChange={e => updateFrom("email", e.target.value)} /></Field>
          </div>
        </section>

        {/* To */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">To (Client Details)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client Name" required><input className={inputCls} placeholder="Priya Verma" value={to.name} onChange={e => updateTo("name", e.target.value)} /></Field>
            <Field label="Company"><input className={inputCls} placeholder="Client Company" value={to.company} onChange={e => updateTo("company", e.target.value)} /></Field>
          </div>
          <Field label="Address"><textarea className={inputCls + " resize-none"} rows={2} value={to.address} onChange={e => updateTo("address", e.target.value)} /></Field>
          <Field label="Phone"><input className={inputCls} placeholder="98XXXXXXXX" value={to.phone} onChange={e => updateTo("phone", e.target.value)} /></Field>
        </section>

        {/* Quote Info */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Quotation Details</h2>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Quote No." required><input className={inputCls} value={quote.number} onChange={e => updateQuote("number", e.target.value)} /></Field>
            <Field label="Date"><input className={inputCls} type="date" value={quote.date} onChange={e => updateQuote("date", e.target.value)} /></Field>
            <Field label="Valid Until"><input className={inputCls} type="date" value={quote.validUntil} onChange={e => updateQuote("validUntil", e.target.value)} /></Field>
          </div>
        </section>

        {/* Line Items */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Items</h2>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={item.id} className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/80 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input className={inputCls} placeholder="Description *" value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs text-muted-foreground mb-1 block">Qty</label><input className={inputCls} type="number" min="0" step="0.01" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Unit</label><input className={inputCls} value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)} /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Rate (₹)</label><input className={inputCls} type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} /></div>
                </div>
                <div className="text-xs text-right text-muted-foreground">Amount: ₹{fmtInr(calcItemTotal(item))}</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition font-medium">
            <Plus className="h-4 w-4" />Add Item
          </button>
        </section>

        {/* Notes + Terms */}
        <section className="space-y-3">
          <Field label="Discount (₹)"><input className={inputCls} type="number" min="0" step="0.01" value={quote.discount} onChange={e => updateQuote("discount", e.target.value)} /></Field>
          <Field label="Notes"><textarea className={inputCls + " resize-none"} rows={2} placeholder="Special notes for the client..." value={quote.notes} onChange={e => updateQuote("notes", e.target.value)} /></Field>
          <Field label="Terms & Conditions"><textarea className={inputCls + " resize-none"} rows={2} value={quote.terms} onChange={e => updateQuote("terms", e.target.value)} /></Field>
        </section>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600/90 transition-colors">
            <Download className="h-4 w-4" />Download PDF
          </button>
          <button type="button" onClick={handleReset} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors">
            <RotateCcw className="h-4 w-4" />Reset
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4">Live Preview</h2>
        <div className="rounded-xl border border-border bg-white text-black p-6 shadow-sm text-xs font-sans">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xl font-bold text-purple-700">{from.company || from.name || "Your Company"}</div>
              {from.name && from.company && <div className="text-xs text-gray-600">{from.name}</div>}
              <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">{from.address}</div>
              {from.phone && <div className="text-xs text-gray-600">Ph: {from.phone}</div>}
              {from.email && <div className="text-xs text-gray-600">{from.email}</div>}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">QUOTATION</div>
              <div className="text-xs text-gray-500 mt-1">No: <span className="font-semibold">{quote.number}</span></div>
              <div className="text-xs text-gray-500">Date: {quote.date}</div>
              <div className="text-xs text-gray-500">Valid Until: {quote.validUntil}</div>
            </div>
          </div>

          {/* To */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Quoted To</div>
            <div className="font-semibold">{to.name || "Client Name"}</div>
            {to.company && <div className="text-xs text-gray-600">{to.company}</div>}
            <div className="text-xs text-gray-600 whitespace-pre-line">{to.address}</div>
            {to.phone && <div className="text-xs text-gray-600">Ph: {to.phone}</div>}
          </div>

          {/* Items */}
          <table className="w-full border-collapse mb-4 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-2 py-1.5 text-left">#</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left">Description</th>
                <th className="border border-gray-200 px-2 py-1.5 text-right">Qty</th>
                <th className="border border-gray-200 px-2 py-1.5 text-right">Rate</th>
                <th className="border border-gray-200 px-2 py-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-200 px-2 py-1.5">{i + 1}</td>
                  <td className="border border-gray-200 px-2 py-1.5">{item.description || "—"}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right">{item.qty} {item.unit}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right">₹{fmtInr(parseFloat(item.rate) || 0)}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right">₹{fmtInr(calcItemTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-4">
            <div className="w-56 space-y-1">
              <div className="flex justify-between text-xs"><span className="text-gray-600">Subtotal</span><span>₹{fmtInr(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span>−₹{fmtInr(discount)}</span></div>}
              <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1"><span>Grand Total</span><span>₹{fmtInr(grandTotal)}</span></div>
            </div>
          </div>

          <div className="text-xs text-gray-500 italic mb-2">
            Amount in words: <span className="font-medium text-gray-700">{amountToWords(grandTotal)}</span>
          </div>

          {quote.notes && (
            <div className="mt-3 border-t border-gray-200 pt-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">Notes</div>
              <div className="text-xs text-gray-600">{quote.notes}</div>
            </div>
          )}
          {quote.terms && (
            <div className="mt-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">Terms & Conditions</div>
              <div className="text-xs text-gray-600">{quote.terms}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateQuoteHtml({
  from, to, quote, items, calcItemTotal, subtotal, discount, grandTotal,
}: {
  from: Party; to: Party; quote: QuoteInfo; items: LineItem[];
  calcItemTotal: (i: LineItem) => number; subtotal: number; discount: number; grandTotal: number;
}): string {
  const rows = items.map((item, i) => `<tr>
    <td>${i + 1}</td><td>${item.description}</td>
    <td class="text-right">${item.qty} ${item.unit}</td>
    <td class="text-right">₹${fmtInr(parseFloat(item.rate) || 0)}</td>
    <td class="text-right">₹${fmtInr(calcItemTotal(item))}</td>
  </tr>`).join("");

  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
      <div>
        <div style="font-size:20px;font-weight:700;color:#7c3aed">${from.company || from.name}</div>
        ${from.name && from.company ? `<div style="font-size:11px;color:#444">${from.name}</div>` : ""}
        <div style="font-size:11px;color:#444;white-space:pre-line;margin-top:4px">${from.address}</div>
        ${from.phone ? `<div style="font-size:11px;color:#444">Ph: ${from.phone}</div>` : ""}
        ${from.email ? `<div style="font-size:11px;color:#444">${from.email}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:700">QUOTATION</div>
        <div style="font-size:11px;color:#666;margin-top:4px">No: <strong>${quote.number}</strong></div>
        <div style="font-size:11px;color:#666">Date: ${quote.date}</div>
        <div style="font-size:11px;color:#666">Valid Until: ${quote.validUntil}</div>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:12px;border-radius:6px;margin-bottom:16px;font-size:11px">
      <div style="font-weight:600;color:#666;text-transform:uppercase;font-size:10px;margin-bottom:4px">Quoted To</div>
      <div style="font-weight:600;font-size:13px">${to.name}</div>
      ${to.company ? `<div style="color:#444">${to.company}</div>` : ""}
      <div style="color:#444;white-space:pre-line">${to.address}</div>
      ${to.phone ? `<div style="color:#444">Ph: ${to.phone}</div>` : ""}
    </div>
    <table style="margin-bottom:16px">
      <thead><tr><th>#</th><th>Description</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <div style="width:200px;font-size:11px">
        <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee"><span>Subtotal</span><span>₹${fmtInr(subtotal)}</span></div>
        ${discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:3px 0;color:#16a34a"><span>Discount</span><span>−₹${fmtInr(discount)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:2px solid #000;font-weight:700;font-size:13px"><span>Grand Total</span><span>₹${fmtInr(grandTotal)}</span></div>
      </div>
    </div>
    <div style="font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:8px">Amount in words: <strong>${amountToWords(grandTotal)}</strong></div>
    ${quote.notes ? `<div style="margin-top:12px;font-size:11px"><strong>Notes:</strong> ${quote.notes}</div>` : ""}
    ${quote.terms ? `<div style="margin-top:8px;font-size:11px"><strong>Terms & Conditions:</strong> ${quote.terms}</div>` : ""}
  `;
}
