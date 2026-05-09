"use client";

import { useState } from "react";
import { Mail, Download, RotateCcw, Info } from "lucide-react";
import { offerLetterConfig } from "./config";
import { fmtInr } from "@/lib/utils";
import { printDocument } from "@/lib/print-pdf";

const WORK_TYPES = ["Full-time", "Part-time", "Contract"] as const;
const PROBATIONS = ["None", "3 months", "6 months"] as const;
const BENEFITS_LIST = ["Health Insurance", "PF", "Gratuity", "Annual Bonus", "Flexible Hours", "WFH"] as const;

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function refNo(): string {
  return `OL-${Date.now().toString().slice(-6)}`;
}

function addDays(d: string, days: number): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label} {required && <span className="text-destructive">*</span>}</label>
      {children}
    </div>
  );
}

export default function OfferLetterTool({ creditCost: _c }: { creditCost?: number }) {
  const [company, setCompany] = useState({ name: "", address: "", hrName: "", hrDesignation: "HR Manager" });
  const [candidate, setCandidate] = useState({ name: "", address: "" });
  const [offer, setOffer] = useState({
    role: "", department: "", reportingTo: "",
    joiningDate: "", workLocation: "", workType: "Full-time" as typeof WORK_TYPES[number],
    ctc: "", probation: "3 months" as typeof PROBATIONS[number],
  });
  const [benefits, setBenefits] = useState<Set<string>>(new Set(["Health Insurance", "PF"]));
  const [date] = useState(today());
  const [ref] = useState(refNo());

  const toggleBenefit = (b: string) => {
    setBenefits(prev => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
  };

  const acceptDeadline = offer.joiningDate ? addDays(date, 7) : "7 days from date of letter";

  const handlePrint = () => {
    const html = generateLetterHtml({ company, candidate, offer, benefits: [...benefits], date, ref, acceptDeadline });
    printDocument(html, `Offer Letter — ${candidate.name}`);
  };

  const handleReset = () => {
    setCompany({ name: "", address: "", hrName: "", hrDesignation: "HR Manager" });
    setCandidate({ name: "", address: "" });
    setOffer({ role: "", department: "", reportingTo: "", joiningDate: "", workLocation: "", workType: "Full-time", ctc: "", probation: "3 months" });
    setBenefits(new Set(["Health Insurance", "PF"]));
  };

  const letterPreview = buildLetterText({ company, candidate, offer, benefits: [...benefits], date, ref, acceptDeadline });

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Mail className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{offerLetterConfig.name}</h1>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">FREE</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{offerLetterConfig.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-400">Free tool — no login required. Login to save your work.</p>
        </div>

        {/* Company */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Company Details</h2>
          <Field label="Company Name" required><input className={inputCls} placeholder="Acme Technologies Pvt Ltd" value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Address"><textarea className={inputCls + " resize-none"} rows={2} value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="HR Name"><input className={inputCls} placeholder="Priya Verma" value={company.hrName} onChange={e => setCompany(p => ({ ...p, hrName: e.target.value }))} /></Field>
            <Field label="HR Designation"><input className={inputCls} value={company.hrDesignation} onChange={e => setCompany(p => ({ ...p, hrDesignation: e.target.value }))} /></Field>
          </div>
        </section>

        {/* Candidate */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Candidate Details</h2>
          <Field label="Full Name" required><input className={inputCls} placeholder="Rahul Sharma" value={candidate.name} onChange={e => setCandidate(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Address"><textarea className={inputCls + " resize-none"} rows={2} value={candidate.address} onChange={e => setCandidate(p => ({ ...p, address: e.target.value }))} /></Field>
        </section>

        {/* Offer */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Offer Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job Title / Role" required><input className={inputCls} placeholder="Software Engineer" value={offer.role} onChange={e => setOffer(p => ({ ...p, role: e.target.value }))} /></Field>
            <Field label="Department"><input className={inputCls} placeholder="Engineering" value={offer.department} onChange={e => setOffer(p => ({ ...p, department: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reporting To"><input className={inputCls} placeholder="CTO / Manager name" value={offer.reportingTo} onChange={e => setOffer(p => ({ ...p, reportingTo: e.target.value }))} /></Field>
            <Field label="Work Location"><input className={inputCls} placeholder="Mumbai / Remote" value={offer.workLocation} onChange={e => setOffer(p => ({ ...p, workLocation: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Joining Date"><input className={inputCls} type="date" value={offer.joiningDate} onChange={e => setOffer(p => ({ ...p, joiningDate: e.target.value }))} /></Field>
            <Field label="Work Type">
              <select className={inputCls} value={offer.workType} onChange={e => setOffer(p => ({ ...p, workType: e.target.value as typeof WORK_TYPES[number] }))}>
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="CTC (Annual, ₹)"><input className={inputCls} type="number" min="0" placeholder="600000" value={offer.ctc} onChange={e => setOffer(p => ({ ...p, ctc: e.target.value }))} /></Field>
          <Field label="Probation Period">
            <select className={inputCls} value={offer.probation} onChange={e => setOffer(p => ({ ...p, probation: e.target.value as typeof PROBATIONS[number] }))}>
              {PROBATIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Benefits</label>
            <div className="flex flex-wrap gap-2">
              {BENEFITS_LIST.map(b => (
                <button key={b} type="button" onClick={() => toggleBenefit(b)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${benefits.has(b) ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-foreground/40"}`}>
                  {b}
                </button>
              ))}
            </div>
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

      {/* RIGHT */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4">Live Preview</h2>
        <div className="rounded-xl border border-border bg-white text-black p-6 shadow-sm text-xs font-sans leading-relaxed">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="text-base font-bold text-purple-700">{company.name || "Company Name"}</div>
            {company.address && <div className="text-xs text-gray-500 whitespace-pre-line">{company.address}</div>}
          </div>

          <div className="flex justify-between mb-4 text-xs">
            <div><span className="text-gray-500">Ref: </span>{ref}</div>
            <div><span className="text-gray-500">Date: </span>{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>

          {candidate.name && <div className="mb-4"><div className="font-semibold">{candidate.name}</div>{candidate.address && <div className="text-gray-600 whitespace-pre-line">{candidate.address}</div>}</div>}

          <div className="font-semibold mb-3 text-sm">Subject: Offer of Employment — {offer.role || "[Role]"}</div>

          <div className="space-y-2 text-xs text-gray-700 whitespace-pre-line">{letterPreview}</div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-gray-600 text-xs mb-4">For {company.name || "Company Name"}</div>
            <div className="text-xs"><div className="font-semibold">{company.hrName || "HR Name"}</div><div className="text-gray-500">{company.hrDesignation}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildLetterText({ company, candidate, offer, benefits, date, ref: _ref, acceptDeadline }: {
  company: { name: string; hrDesignation: string; hrName: string; address: string };
  candidate: { name: string; address: string };
  offer: { role: string; department: string; reportingTo: string; joiningDate: string; workLocation: string; workType: string; ctc: string; probation: string };
  benefits: string[]; date: string; ref: string; acceptDeadline: string;
}): string {
  const ctcFormatted = offer.ctc ? `₹${fmtInr(parseFloat(offer.ctc) || 0)} per annum` : "[CTC]";
  const joiningFormatted = offer.joiningDate
    ? new Date(offer.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "[Joining Date]";

  return `Dear ${candidate.name || "[Candidate Name]"},

We are pleased to offer you the position of ${offer.role || "[Role]"} at ${company.name || "[Company]"}${offer.department ? `, ${offer.department} Department` : ""}.

Position: ${offer.role || "[Role]"}
${offer.reportingTo ? `Reporting To: ${offer.reportingTo}` : ""}
Location: ${offer.workLocation || "[Location]"}
Employment Type: ${offer.workType}
Joining Date: ${joiningFormatted}
Annual CTC: ${ctcFormatted}
${offer.probation !== "None" ? `Probation Period: ${offer.probation}` : ""}

Benefits include: ${benefits.length > 0 ? benefits.join(", ") : "As per company policy"}.

Kindly sign and return a copy of this letter as acceptance by ${acceptDeadline}.

We look forward to welcoming you to our team.`;
}

function generateLetterHtml({ company, candidate, offer, benefits, date, ref, acceptDeadline }: {
  company: { name: string; address: string; hrName: string; hrDesignation: string };
  candidate: { name: string; address: string };
  offer: { role: string; department: string; reportingTo: string; joiningDate: string; workLocation: string; workType: string; ctc: string; probation: string };
  benefits: string[]; date: string; ref: string; acceptDeadline: string;
}): string {
  const ctcFormatted = offer.ctc ? `₹${fmtInr(parseFloat(offer.ctc) || 0)} per annum` : "[CTC]";
  const joiningFormatted = offer.joiningDate
    ? new Date(offer.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "[Joining Date]";
  const dateFormatted = new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return `
    <div style="border-bottom:1px solid #ddd;padding-bottom:12px;margin-bottom:16px">
      <div style="font-size:18px;font-weight:700;color:#7c3aed">${company.name}</div>
      ${company.address ? `<div style="font-size:11px;color:#666;margin-top:4px;white-space:pre-line">${company.address}</div>` : ""}
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:11px">
      <div>Ref: ${ref}</div><div>Date: ${dateFormatted}</div>
    </div>
    ${candidate.name ? `<div style="margin-bottom:12px;font-size:11px"><strong>${candidate.name}</strong>${candidate.address ? `<br/><span style="color:#444;white-space:pre-line">${candidate.address}</span>` : ""}</div>` : ""}
    <div style="font-size:12px;font-weight:600;margin-bottom:12px">Subject: Offer of Employment — ${offer.role}</div>
    <p style="font-size:11px;margin-bottom:10px">Dear ${candidate.name || "[Candidate Name]"},</p>
    <p style="font-size:11px;margin-bottom:10px">We are pleased to offer you the position of <strong>${offer.role}</strong> at <strong>${company.name}</strong>${offer.department ? `, ${offer.department} Department` : ""}.</p>
    <table style="margin-bottom:12px;font-size:11px;width:auto">
      <tr><td style="padding:3px 12px 3px 0;color:#666">Position</td><td style="font-weight:600">${offer.role}</td></tr>
      ${offer.reportingTo ? `<tr><td style="padding:3px 12px 3px 0;color:#666">Reporting To</td><td>${offer.reportingTo}</td></tr>` : ""}
      <tr><td style="padding:3px 12px 3px 0;color:#666">Location</td><td>${offer.workLocation}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666">Employment Type</td><td>${offer.workType}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666">Joining Date</td><td>${joiningFormatted}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666">Annual CTC</td><td><strong>${ctcFormatted}</strong></td></tr>
      ${offer.probation !== "None" ? `<tr><td style="padding:3px 12px 3px 0;color:#666">Probation</td><td>${offer.probation}</td></tr>` : ""}
    </table>
    <p style="font-size:11px;margin-bottom:10px">Benefits include: <strong>${benefits.length > 0 ? benefits.join(", ") : "As per company policy"}</strong>.</p>
    <p style="font-size:11px;margin-bottom:10px">Kindly sign and return a copy of this letter as acceptance by <strong>${acceptDeadline}</strong>.</p>
    <p style="font-size:11px;margin-bottom:24px">We look forward to welcoming you to our team.</p>
    <div style="margin-top:24px;font-size:11px">
      <div style="color:#666;margin-bottom:32px">For ${company.name}</div>
      <div style="font-weight:600">${company.hrName}</div>
      <div style="color:#666">${company.hrDesignation}</div>
    </div>
  `;
}
