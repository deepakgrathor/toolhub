"use client";

import { useState } from "react";
import { Banknote, Download, RotateCcw } from "lucide-react";
import { salarySlipConfig } from "./config";
import { amountToWords, fmtInr } from "@/lib/utils";
import { printDocument } from "@/lib/print-pdf";
import { SmartInput } from "@/components/ui/SmartInput";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label} {required && <span className="text-destructive">*</span>}</label>
      {children}
    </div>
  );
}

export default function SalarySlipTool({ creditCost: _c }: { creditCost?: number }) {
  const [company, setCompany] = useState({ name: "", address: "" });
  const [employee, setEmployee] = useState({
    name: "", id: "", designation: "", department: "", bankAccount: "", pan: "",
  });
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(String(currentYear));
  const [earnings, setEarnings] = useState({
    basic: "", hra: "", specialAllowance: "", otherAllowances: "",
  });
  const [deductions, setDeductions] = useState({
    pf: "", esi: "", tds: "", otherDeductions: "",
  });
  const [pfAuto, setPfAuto] = useState(true);

  const basic = parseFloat(earnings.basic) || 0;
  const hra = parseFloat(earnings.hra) || 0;
  const special = parseFloat(earnings.specialAllowance) || 0;
  const other = parseFloat(earnings.otherAllowances) || 0;
  const grossEarnings = basic + hra + special + other;

  const pfVal = pfAuto ? Math.round(basic * 0.12) : (parseFloat(deductions.pf) || 0);
  const esiVal = parseFloat(deductions.esi) || 0;
  const tdsVal = parseFloat(deductions.tds) || 0;
  const otherDed = parseFloat(deductions.otherDeductions) || 0;
  const totalDeductions = pfVal + esiVal + tdsVal + otherDed;
  const netPay = grossEarnings - totalDeductions;

  const handlePrint = () => {
    const html = generateSlipHtml({
      company, employee, month, year,
      earnings: { basic, hra, special, other, gross: grossEarnings },
      deductions: { pf: pfVal, esi: esiVal, tds: tdsVal, other: otherDed, total: totalDeductions },
      netPay,
    });
    printDocument(html, `Salary Slip — ${employee.name} — ${month} ${year}`);
  };

  const handleReset = () => {
    setCompany({ name: "", address: "" });
    setEmployee({ name: "", id: "", designation: "", department: "", bankAccount: "", pan: "" });
    setEarnings({ basic: "", hra: "", specialAllowance: "", otherAllowances: "" });
    setDeductions({ pf: "", esi: "", tds: "", otherDeductions: "" });
    setPfAuto(true);
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Banknote className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{salarySlipConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">FREE</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{salarySlipConfig.description}</p>
          </div>
        </div>

        {/* Company */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Company Info</h2>
          <Field label="Company Name" required><SmartInput field="businessName" className={inputCls} placeholder="Acme Technologies Pvt Ltd" value={company.name} onChange={v => setCompany(p => ({ ...p, name: v }))} /></Field>
          <Field label="Address"><SmartInput field="address" className={inputCls} placeholder="Company address" value={company.address} onChange={v => setCompany(p => ({ ...p, address: v }))} /></Field>
        </section>

        {/* Employee */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Employee Info</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee Name" required><input className={inputCls} placeholder="Rahul Sharma" value={employee.name} onChange={e => setEmployee(p => ({ ...p, name: e.target.value }))} /></Field>
            <Field label="Employee ID"><input className={inputCls} placeholder="EMP-001" value={employee.id} onChange={e => setEmployee(p => ({ ...p, id: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Designation"><input className={inputCls} placeholder="Software Engineer" value={employee.designation} onChange={e => setEmployee(p => ({ ...p, designation: e.target.value }))} /></Field>
            <Field label="Department"><input className={inputCls} placeholder="Engineering" value={employee.department} onChange={e => setEmployee(p => ({ ...p, department: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bank A/C (last 4 digits)"><input className={inputCls} placeholder="XXXX" maxLength={4} value={employee.bankAccount} onChange={e => setEmployee(p => ({ ...p, bankAccount: e.target.value }))} /></Field>
            <Field label="PAN"><input className={inputCls} placeholder="AAAAA0000A" value={employee.pan} onChange={e => setEmployee(p => ({ ...p, pan: e.target.value.toUpperCase() }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Month">
              <select className={inputCls} value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Year">
              <select className={inputCls} value={year} onChange={e => setYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Earnings */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Earnings (₹)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Basic Salary" required><input className={inputCls} type="number" min="0" placeholder="0" value={earnings.basic} onChange={e => setEarnings(p => ({ ...p, basic: e.target.value }))} /></Field>
            <Field label="HRA"><input className={inputCls} type="number" min="0" placeholder="0" value={earnings.hra} onChange={e => setEarnings(p => ({ ...p, hra: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Special Allowance"><input className={inputCls} type="number" min="0" placeholder="0" value={earnings.specialAllowance} onChange={e => setEarnings(p => ({ ...p, specialAllowance: e.target.value }))} /></Field>
            <Field label="Other Allowances"><input className={inputCls} type="number" min="0" placeholder="0" value={earnings.otherAllowances} onChange={e => setEarnings(p => ({ ...p, otherAllowances: e.target.value }))} /></Field>
          </div>
          <div className="flex justify-between text-sm font-medium rounded-lg bg-surface px-3 py-2">
            <span className="text-muted-foreground">Gross Earnings</span>
            <span className="text-foreground font-semibold">₹{fmtInr(grossEarnings)}</span>
          </div>
        </section>

        {/* Deductions */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Deductions (₹)</h2>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">PF (auto: 12% of Basic)</span>
            <button type="button" onClick={() => setPfAuto(v => !v)} className={`text-xs px-3 py-1 rounded-full border transition ${pfAuto ? "bg-accent text-white border-accent" : "border-border text-muted-foreground"}`}>
              {pfAuto ? "Auto" : "Manual"}
            </button>
          </div>
          {pfAuto ? (
            <div className="flex justify-between text-sm rounded-lg bg-surface px-3 py-2">
              <span className="text-muted-foreground">PF (12%)</span>
              <span className="text-foreground font-medium">₹{fmtInr(pfVal)}</span>
            </div>
          ) : (
            <Field label="PF Amount"><input className={inputCls} type="number" min="0" placeholder="0" value={deductions.pf} onChange={e => setDeductions(p => ({ ...p, pf: e.target.value }))} /></Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="ESI"><input className={inputCls} type="number" min="0" placeholder="0" value={deductions.esi} onChange={e => setDeductions(p => ({ ...p, esi: e.target.value }))} /></Field>
            <Field label="TDS"><input className={inputCls} type="number" min="0" placeholder="0" value={deductions.tds} onChange={e => setDeductions(p => ({ ...p, tds: e.target.value }))} /></Field>
          </div>
          <Field label="Other Deductions"><input className={inputCls} type="number" min="0" placeholder="0" value={deductions.otherDeductions} onChange={e => setDeductions(p => ({ ...p, otherDeductions: e.target.value }))} /></Field>
          <div className="flex justify-between text-sm font-medium rounded-lg bg-surface px-3 py-2">
            <span className="text-muted-foreground">Total Deductions</span>
            <span className="text-red-400 font-semibold">₹{fmtInr(totalDeductions)}</span>
          </div>
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

      {/* RIGHT — Preview */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4">Live Preview</h2>
        <div className="rounded-xl border border-border bg-white text-black p-6 shadow-sm text-xs font-sans">
          {/* Company Header */}
          <div className="text-center mb-4 border-b border-gray-200 pb-4">
            <div className="text-xl font-bold text-purple-700">{company.name || "Company Name"}</div>
            {company.address && <div className="text-xs text-gray-500 mt-1 whitespace-pre-line">{company.address}</div>}
            <div className="text-sm font-semibold text-gray-700 mt-2">SALARY SLIP</div>
            <div className="text-xs text-gray-500">{month} {year}</div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div><span className="text-gray-500">Employee Name: </span><span className="font-medium">{employee.name || "—"}</span></div>
            <div><span className="text-gray-500">Employee ID: </span><span className="font-medium">{employee.id || "—"}</span></div>
            <div><span className="text-gray-500">Designation: </span><span className="font-medium">{employee.designation || "—"}</span></div>
            <div><span className="text-gray-500">Department: </span><span className="font-medium">{employee.department || "—"}</span></div>
            {employee.bankAccount && <div><span className="text-gray-500">Bank A/C: </span><span className="font-medium">XXXX XXXX XXXX {employee.bankAccount}</span></div>}
            {employee.pan && <div><span className="text-gray-500">PAN: </span><span className="font-medium">{employee.pan}</span></div>}
          </div>

          {/* Earnings + Deductions side by side */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <div className="font-semibold text-xs text-gray-700 bg-gray-100 px-2 py-1.5 mb-1">Earnings</div>
              {[
                ["Basic Salary", basic],
                ["HRA", hra],
                ["Special Allowance", special],
                ["Other Allowances", other],
              ].map(([lbl, val]) => (
                <div key={lbl as string} className="flex justify-between px-2 py-1 text-xs border-b border-gray-100">
                  <span className="text-gray-600">{lbl as string}</span>
                  <span>₹{fmtInr(val as number)}</span>
                </div>
              ))}
              <div className="flex justify-between px-2 py-1 text-xs font-semibold bg-gray-50">
                <span>Gross</span><span>₹{fmtInr(grossEarnings)}</span>
              </div>
            </div>
            <div>
              <div className="font-semibold text-xs text-gray-700 bg-gray-100 px-2 py-1.5 mb-1">Deductions</div>
              {[
                ["PF", pfVal],
                ["ESI", esiVal],
                ["TDS", tdsVal],
                ["Other", otherDed],
              ].map(([lbl, val]) => (
                <div key={lbl as string} className="flex justify-between px-2 py-1 text-xs border-b border-gray-100">
                  <span className="text-gray-600">{lbl as string}</span>
                  <span>₹{fmtInr(val as number)}</span>
                </div>
              ))}
              <div className="flex justify-between px-2 py-1 text-xs font-semibold bg-gray-50">
                <span>Total</span><span>₹{fmtInr(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="flex justify-between items-center bg-purple-700 text-white px-3 py-2 rounded-lg mb-3">
            <span className="font-bold text-sm">Net Pay</span>
            <span className="font-bold text-lg">₹{fmtInr(netPay)}</span>
          </div>
          <div className="text-xs text-gray-500 italic">
            Amount in words: <span className="font-medium text-gray-700">{amountToWords(netPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateSlipHtml({
  company, employee, month, year, earnings, deductions, netPay,
}: {
  company: { name: string; address: string };
  employee: { name: string; id: string; designation: string; department: string; bankAccount: string; pan: string };
  month: string; year: string;
  earnings: { basic: number; hra: number; special: number; other: number; gross: number };
  deductions: { pf: number; esi: number; tds: number; other: number; total: number };
  netPay: number;
}): string {
  return `
    <div style="text-align:center;margin-bottom:16px;border-bottom:1px solid #ddd;padding-bottom:16px">
      <div style="font-size:20px;font-weight:700;color:#7c3aed">${company.name}</div>
      ${company.address ? `<div style="font-size:11px;color:#666;margin-top:4px;white-space:pre-line">${company.address}</div>` : ""}
      <div style="font-size:14px;font-weight:600;margin-top:8px">SALARY SLIP</div>
      <div style="font-size:11px;color:#666">${month} ${year}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:11px">
      <div><span style="color:#666">Employee Name: </span><strong>${employee.name}</strong></div>
      <div><span style="color:#666">Employee ID: </span><strong>${employee.id}</strong></div>
      <div><span style="color:#666">Designation: </span><strong>${employee.designation}</strong></div>
      <div><span style="color:#666">Department: </span><strong>${employee.department}</strong></div>
      ${employee.bankAccount ? `<div><span style="color:#666">Bank A/C: </span><strong>XXXX XXXX XXXX ${employee.bankAccount}</strong></div>` : ""}
      ${employee.pan ? `<div><span style="color:#666">PAN: </span><strong>${employee.pan}</strong></div>` : ""}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div>
        <div style="font-weight:600;font-size:11px;background:#f5f5f5;padding:6px 8px;margin-bottom:4px">Earnings</div>
        ${[["Basic Salary", earnings.basic], ["HRA", earnings.hra], ["Special Allowance", earnings.special], ["Other Allowances", earnings.other]].map(([l, v]) => `<div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:11px;border-bottom:1px solid #eee"><span style="color:#666">${l}</span><span>₹${fmtInr(v as number)}</span></div>`).join("")}
        <div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:11px;font-weight:600;background:#f9f9f9"><span>Gross</span><span>₹${fmtInr(earnings.gross)}</span></div>
      </div>
      <div>
        <div style="font-weight:600;font-size:11px;background:#f5f5f5;padding:6px 8px;margin-bottom:4px">Deductions</div>
        ${[["PF", deductions.pf], ["ESI", deductions.esi], ["TDS", deductions.tds], ["Other", deductions.other]].map(([l, v]) => `<div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:11px;border-bottom:1px solid #eee"><span style="color:#666">${l}</span><span>₹${fmtInr(v as number)}</span></div>`).join("")}
        <div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:11px;font-weight:600;background:#f9f9f9"><span>Total</span><span>₹${fmtInr(deductions.total)}</span></div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;background:#7c3aed;color:#fff;padding:10px 12px;border-radius:8px;margin-bottom:12px">
      <span style="font-weight:700;font-size:14px">Net Pay</span>
      <span style="font-weight:700;font-size:18px">₹${fmtInr(netPay)}</span>
    </div>
    <div style="font-size:11px;color:#666">Amount in words: <strong>${amountToWords(netPay)}</strong></div>
  `;
}
