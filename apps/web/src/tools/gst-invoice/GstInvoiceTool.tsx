"use client";

import { useState, useCallback } from "react";
import { Receipt, Plus, Trash2, Download, RotateCcw, Info } from "lucide-react";
import { gstInvoiceConfig } from "./config";
import { amountToWords, fmtInr, INDIAN_STATES } from "@/lib/utils";
import { printDocument } from "@/lib/print-pdf";

interface Party {
  name: string;
  gstin: string;
  address: string;
  state: string;
  phone: string;
  email: string;
}

interface InvoiceInfo {
  number: string;
  date: string;
  dueDate: string;
}

interface LineItem {
  id: string;
  description: string;
  hsn: string;
  qty: string;
  unit: string;
  rate: string;
  gstRate: string;
}

const GST_RATES = ["0", "5", "12", "18", "28"];

const DEFAULT_SELLER: Party = { name: "", gstin: "", address: "", state: "Maharashtra", phone: "", email: "" };
const DEFAULT_BUYER: Party = { name: "", gstin: "", address: "", state: "Maharashtra", phone: "", email: "" };

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", hsn: "", qty: "1", unit: "Nos", rate: "", gstRate: "18" };
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition";
const selectCls = inputCls;

export default function GstInvoiceTool({ creditCost: _c }: { creditCost?: number }) {
  const [seller, setSeller] = useState<Party>({ ...DEFAULT_SELLER });
  const [buyer, setBuyer] = useState<Party>({ ...DEFAULT_BUYER });
  const [invoice, setInvoice] = useState<InvoiceInfo>({ number: "INV-001", date: today(), dueDate: "" });
  const [items, setItems] = useState<LineItem[]>([newItem()]);

  const updateSeller = (k: keyof Party, v: string) => setSeller(p => ({ ...p, [k]: v }));
  const updateBuyer = (k: keyof Party, v: string) => setBuyer(p => ({ ...p, [k]: v }));
  const updateInvoice = (k: keyof InvoiceInfo, v: string) => setInvoice(p => ({ ...p, [k]: v }));
  const updateItem = (id: string, k: keyof LineItem, v: string) =>
    setItems(prev => prev.map(item => item.id === id ? { ...item, [k]: v } : item));
  const addItem = () => setItems(prev => [...prev, newItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const calcItem = useCallback((item: LineItem) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const gstRate = parseFloat(item.gstRate) || 0;
    const taxable = qty * rate;
    const gstAmt = taxable * gstRate / 100;
    return { taxable, gstAmt, total: taxable + gstAmt };
  }, []);

  const totals = items.reduce(
    (acc, item) => {
      const { taxable, gstAmt } = calcItem(item);
      return { taxable: acc.taxable + taxable, gstAmt: acc.gstAmt + gstAmt };
    },
    { taxable: 0, gstAmt: 0 }
  );
  const grandTotal = totals.taxable + totals.gstAmt;
  const isSameState = seller.state === buyer.state;

  const handlePrint = () => {
    const html = generateInvoiceHtml({ seller, buyer, invoice, items, calcItem, totals, grandTotal, isSameState });
    printDocument(html, `Invoice ${invoice.number}`);
  };

  const handleReset = () => {
    setSeller({ ...DEFAULT_SELLER });
    setBuyer({ ...DEFAULT_BUYER });
    setInvoice({ number: "INV-001", date: today(), dueDate: "" });
    setItems([newItem()]);
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Receipt className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{gstInvoiceConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">FREE</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{gstInvoiceConfig.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-400">Free tool — no login required. Login to save your work.</p>
        </div>

        {/* Seller */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Seller Details</h2>
          <Field label="Business Name" required>
            <input className={inputCls} placeholder="Your Company Pvt Ltd" value={seller.name} onChange={e => updateSeller("name", e.target.value)} />
          </Field>
          <Field label="GSTIN">
            <input className={inputCls} placeholder="22AAAAA0000A1Z5" value={seller.gstin} onChange={e => updateSeller("gstin", e.target.value.toUpperCase())} maxLength={15} />
          </Field>
          <Field label="Address">
            <textarea className={inputCls + " resize-none"} rows={2} placeholder="Street, City, PIN" value={seller.address} onChange={e => updateSeller("address", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <select className={selectCls} value={seller.state} onChange={e => updateSeller("state", e.target.value)}>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Phone">
              <input className={inputCls} placeholder="98XXXXXXXX" value={seller.phone} onChange={e => updateSeller("phone", e.target.value)} />
            </Field>
          </div>
          <Field label="Email">
            <input className={inputCls} type="email" placeholder="billing@company.com" value={seller.email} onChange={e => updateSeller("email", e.target.value)} />
          </Field>
        </section>

        {/* Buyer */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Buyer Details</h2>
          <Field label="Business / Client Name" required>
            <input className={inputCls} placeholder="Client Company" value={buyer.name} onChange={e => updateBuyer("name", e.target.value)} />
          </Field>
          <Field label="GSTIN (optional)">
            <input className={inputCls} placeholder="22AAAAA0000A1Z5" value={buyer.gstin} onChange={e => updateBuyer("gstin", e.target.value.toUpperCase())} maxLength={15} />
          </Field>
          <Field label="Address">
            <textarea className={inputCls + " resize-none"} rows={2} placeholder="Street, City, PIN" value={buyer.address} onChange={e => updateBuyer("address", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <select className={selectCls} value={buyer.state} onChange={e => updateBuyer("state", e.target.value)}>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Phone">
              <input className={inputCls} placeholder="98XXXXXXXX" value={buyer.phone} onChange={e => updateBuyer("phone", e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Invoice Info */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Invoice Details</h2>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Invoice No." required>
              <input className={inputCls} value={invoice.number} onChange={e => updateInvoice("number", e.target.value)} />
            </Field>
            <Field label="Date" required>
              <input className={inputCls} type="date" value={invoice.date} onChange={e => updateInvoice("date", e.target.value)} />
            </Field>
            <Field label="Due Date">
              <input className={inputCls} type="date" value={invoice.dueDate} onChange={e => updateInvoice("dueDate", e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Line Items */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Line Items</h2>
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
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="HSN Code" value={item.hsn} onChange={e => updateItem(item.id, "hsn", e.target.value)} />
                  <input className={inputCls} placeholder="Unit (Nos/Kg/...)" value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                    <input className={inputCls} type="number" min="0" step="0.01" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Rate (₹)</label>
                    <input className={inputCls} type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">GST %</label>
                    <select className={selectCls} value={item.gstRate} onChange={e => updateItem(item.id, "gstRate", e.target.value)}>
                      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  Amount: ₹{fmtInr(calcItem(item).taxable)}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition font-medium">
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </section>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {/* RIGHT — Live Preview */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4">Live Preview</h2>
        <div className="rounded-xl border border-border bg-white text-black p-6 shadow-sm text-xs font-sans">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xl font-bold text-purple-700">{seller.name || "Your Company Name"}</div>
              {seller.gstin && <div className="text-xs text-gray-500 mt-0.5">GSTIN: {seller.gstin}</div>}
              <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">{seller.address}</div>
              {seller.phone && <div className="text-xs text-gray-600">Ph: {seller.phone}</div>}
              {seller.email && <div className="text-xs text-gray-600">{seller.email}</div>}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">TAX INVOICE</div>
              <div className="text-xs text-gray-500 mt-1">No: <span className="font-semibold text-gray-800">{invoice.number}</span></div>
              <div className="text-xs text-gray-500">Date: <span className="text-gray-800">{invoice.date}</span></div>
              {invoice.dueDate && <div className="text-xs text-gray-500">Due: <span className="text-gray-800">{invoice.dueDate}</span></div>}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Bill To</div>
            <div className="font-semibold text-gray-800">{buyer.name || "Client Name"}</div>
            {buyer.gstin && <div className="text-xs text-gray-500">GSTIN: {buyer.gstin}</div>}
            <div className="text-xs text-gray-600 whitespace-pre-line">{buyer.address}</div>
            {buyer.phone && <div className="text-xs text-gray-600">Ph: {buyer.phone}</div>}
            {buyer.state && <div className="text-xs text-gray-600">State: {buyer.state}</div>}
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-4 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-2 py-1.5 text-left">#</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left">Description</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center">HSN</th>
                <th className="border border-gray-200 px-2 py-1.5 text-right">Qty</th>
                <th className="border border-gray-200 px-2 py-1.5 text-right">Rate</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center">GST%</th>
                <th className="border border-gray-200 px-2 py-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const { taxable } = calcItem(item);
                return (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-200 px-2 py-1.5">{i + 1}</td>
                    <td className="border border-gray-200 px-2 py-1.5">{item.description || "-"}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center">{item.hsn}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">{item.qty} {item.unit}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">₹{fmtInr(parseFloat(item.rate) || 0)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center">{item.gstRate}%</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">₹{fmtInr(taxable)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Tax Summary */}
          <div className="flex justify-end mb-4">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Taxable Amount</span>
                <span>₹{fmtInr(totals.taxable)}</span>
              </div>
              {isSameState ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">CGST</span>
                    <span>₹{fmtInr(totals.gstAmt / 2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">SGST</span>
                    <span>₹{fmtInr(totals.gstAmt / 2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">IGST</span>
                  <span>₹{fmtInr(totals.gstAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
                <span>Grand Total</span>
                <span>₹{fmtInr(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 italic border-t border-gray-200 pt-2">
            Amount in words: <span className="font-medium text-gray-700">{amountToWords(grandTotal)}</span>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-center">
            {isSameState ? `${seller.state} → ${buyer.state} (Intrastate — CGST + SGST)` : `${seller.state} → ${buyer.state} (Interstate — IGST)`}
          </div>
        </div>
      </div>
    </div>
  );
}

function generateInvoiceHtml({
  seller, buyer, invoice, items, calcItem, totals, grandTotal, isSameState,
}: {
  seller: Party; buyer: Party; invoice: InvoiceInfo;
  items: LineItem[]; calcItem: (i: LineItem) => { taxable: number; gstAmt: number; total: number };
  totals: { taxable: number; gstAmt: number }; grandTotal: number; isSameState: boolean;
}): string {
  const rows = items.map((item, i) => {
    const { taxable } = calcItem(item);
    return `<tr>
      <td>${i + 1}</td>
      <td>${item.description}</td>
      <td class="text-center">${item.hsn}</td>
      <td class="text-right">${item.qty} ${item.unit}</td>
      <td class="text-right">₹${fmtInr(parseFloat(item.rate) || 0)}</td>
      <td class="text-center">${item.gstRate}%</td>
      <td class="text-right">₹${fmtInr(taxable)}</td>
    </tr>`;
  }).join("");

  const taxRows = isSameState
    ? `<div class="flex justify-between"><span>CGST</span><span>₹${fmtInr(totals.gstAmt / 2)}</span></div>
       <div class="flex justify-between"><span>SGST</span><span>₹${fmtInr(totals.gstAmt / 2)}</span></div>`
    : `<div class="flex justify-between"><span>IGST</span><span>₹${fmtInr(totals.gstAmt)}</span></div>`;

  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
      <div>
        <div style="font-size:20px;font-weight:700;color:#7c3aed">${seller.name}</div>
        ${seller.gstin ? `<div style="font-size:11px;color:#666">GSTIN: ${seller.gstin}</div>` : ""}
        <div style="font-size:11px;color:#444;white-space:pre-line;margin-top:4px">${seller.address}</div>
        ${seller.phone ? `<div style="font-size:11px;color:#444">Ph: ${seller.phone}</div>` : ""}
        ${seller.email ? `<div style="font-size:11px;color:#444">${seller.email}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:700">TAX INVOICE</div>
        <div style="font-size:11px;color:#666;margin-top:4px">No: <strong>${invoice.number}</strong></div>
        <div style="font-size:11px;color:#666">Date: ${invoice.date}</div>
        ${invoice.dueDate ? `<div style="font-size:11px;color:#666">Due: ${invoice.dueDate}</div>` : ""}
      </div>
    </div>

    <div style="background:#f9f9f9;padding:12px;border-radius:6px;margin-bottom:16px;font-size:11px">
      <div style="font-weight:600;color:#666;text-transform:uppercase;font-size:10px;margin-bottom:4px">Bill To</div>
      <div style="font-weight:600;font-size:13px">${buyer.name}</div>
      ${buyer.gstin ? `<div style="color:#666">GSTIN: ${buyer.gstin}</div>` : ""}
      <div style="color:#444;white-space:pre-line">${buyer.address}</div>
      ${buyer.phone ? `<div style="color:#444">Ph: ${buyer.phone}</div>` : ""}
      ${buyer.state ? `<div style="color:#444">State: ${buyer.state}</div>` : ""}
    </div>

    <table style="margin-bottom:16px">
      <thead>
        <tr><th>#</th><th>Description</th><th class="text-center">HSN</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-center">GST%</th><th class="text-right">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <div style="width:220px;font-size:11px">
        <div class="flex justify-between" style="padding:3px 0;border-bottom:1px solid #eee"><span>Taxable Amount</span><span>₹${fmtInr(totals.taxable)}</span></div>
        ${taxRows}
        <div class="flex justify-between" style="padding:6px 0;border-top:2px solid #000;font-weight:700;font-size:13px"><span>Grand Total</span><span>₹${fmtInr(grandTotal)}</span></div>
      </div>
    </div>

    <div style="font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:8px">
      Amount in words: <strong>${amountToWords(grandTotal)}</strong>
    </div>
    <div style="font-size:10px;color:#999;margin-top:8px;text-align:center">
      ${isSameState ? `${seller.state} → ${buyer.state} (Intrastate — CGST + SGST)` : `${seller.state} → ${buyer.state} (Interstate — IGST)`}
    </div>
  `;
}
