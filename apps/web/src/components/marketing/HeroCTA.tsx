"use client";

import { ArrowRight } from "lucide-react";
import {
  FileText, Video, Image, Heading, Zap, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode,
  MessageCircle, Banknote, FileSearch, Briefcase,
  Mail, TrendingUp, Shield, Calculator, Table2,
  Gavel, Lock, AlertCircle, AtSign, Linkedin,
  BarChart2, BadgeDollarSign,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

// ── Hero CTA (hero section) ────────────────────────────────────────────────────

export function HeroCTA() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
      <button
        onClick={() => openAuthModal("signup")}
        className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
      >
        Start Free — No Card Needed <ArrowRight className="h-5 w-5" />
      </button>
      <a
        href="/tools"
        className="flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        Explore Tools
      </a>
    </div>
  );
}

// ── Final CTA (bottom banner) ─────────────────────────────────────────────────

export function FinalCTA() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button
        onClick={() => openAuthModal("signup")}
        className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary hover:opacity-90 transition-opacity shadow-md"
      >
        Create Free Account <ArrowRight className="h-5 w-5" />
      </button>
      <a
        href="/tools"
        className="flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
      >
        Explore Tools
      </a>
    </div>
  );
}

// ── Tools Showcase (homepage Section 5) ───────────────────────────────────────
// Self-contained client component — no server-to-client icon passing

const TOOLS = [
  { slug: "blog-generator",     name: "Blog Generator",       Icon: FileText,        desc: "SEO blogs in seconds",         credit: 3 },
  { slug: "yt-script",          name: "YT Script Writer",     Icon: Video,           desc: "Viral YouTube scripts",        credit: 3 },
  { slug: "thumbnail-ai",       name: "Thumbnail AI",         Icon: Image,           desc: "AI thumbnail generation",      credit: 5 },
  { slug: "title-generator",    name: "Title Generator",      Icon: Heading,         desc: "Click-worthy titles",          credit: 1 },
  { slug: "hook-writer",        name: "Hook Writer",          Icon: Zap,             desc: "Attention-grabbing hooks",     credit: 1 },
  { slug: "caption-generator",  name: "Caption Generator",    Icon: MessageSquare,   desc: "Social media captions",        credit: 1 },
  { slug: "gst-invoice",        name: "GST Invoice",          Icon: Receipt,         desc: "Professional GST invoices",    credit: 2 },
  { slug: "expense-tracker",    name: "Expense Tracker",      Icon: Wallet,          desc: "Smart expense summaries",      credit: 1 },
  { slug: "quotation-generator",name: "Quotation Generator",  Icon: ClipboardList,   desc: "Professional quotations",      credit: 2 },
  { slug: "website-generator",  name: "Website Generator",    Icon: Globe,           desc: "AI website copy generator",    credit: 4 },
  { slug: "qr-generator",       name: "QR Generator",         Icon: QrCode,          desc: "Custom QR codes instantly",    credit: 0 },
  { slug: "gst-calculator",     name: "GST Calculator",       Icon: Calculator,      desc: "Quick GST calculations",       credit: 0 },
  { slug: "jd-generator",       name: "JD Generator",         Icon: Briefcase,       desc: "Job descriptions in minutes",  credit: 2 },
  { slug: "resume-screener",    name: "Resume Screener",      Icon: FileSearch,      desc: "AI resume shortlisting",       credit: 3 },
  { slug: "appraisal-draft",    name: "Appraisal Draft",      Icon: TrendingUp,      desc: "Performance appraisals",       credit: 2 },
  { slug: "policy-generator",   name: "Policy Generator",     Icon: Shield,          desc: "HR policy documents",          credit: 2 },
  { slug: "offer-letter",       name: "Offer Letter",         Icon: Mail,            desc: "Professional offer letters",   credit: 2 },
  { slug: "salary-slip",        name: "Salary Slip",          Icon: Banknote,        desc: "Salary slips in seconds",      credit: 1 },
  { slug: "legal-notice",       name: "Legal Notice",         Icon: Gavel,           desc: "Draft legal notices fast",     credit: 3 },
  { slug: "nda-generator",      name: "NDA Generator",        Icon: Lock,            desc: "Non-disclosure agreements",    credit: 3 },
  { slug: "legal-disclaimer",   name: "Legal Disclaimer",     Icon: AlertCircle,     desc: "Website legal disclaimers",    credit: 2 },
  { slug: "tds-sheet",          name: "TDS Sheet",            Icon: Table2,          desc: "TDS calculations & sheets",    credit: 1 },
  { slug: "whatsapp-bulk",      name: "WhatsApp Bulk",        Icon: MessageCircle,   desc: "Bulk message templates",       credit: 1 },
  { slug: "ad-copy",            name: "Ad Copy",              Icon: BadgeDollarSign, desc: "High-converting ad copy",      credit: 2 },
  { slug: "email-subject",      name: "Email Subject",        Icon: AtSign,          desc: "High open-rate subjects",      credit: 1 },
  { slug: "linkedin-bio",       name: "LinkedIn Bio",         Icon: Linkedin,        desc: "Professional LinkedIn bios",   credit: 2 },
  { slug: "seo-auditor",        name: "SEO Auditor",          Icon: BarChart2,       desc: "Quick SEO content audit",      credit: 3 },
];

export function ToolsShowcaseSection() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {TOOLS.map(({ slug, name, Icon, desc, credit }) => (
        <button
          key={slug}
          onClick={() => openAuthModal("signup")}
          className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-150 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xs font-semibold text-foreground mb-1 leading-tight">{name}</div>
          <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{desc}</div>
          <div className="mt-2 text-[10px] font-bold text-primary">
            {credit === 0 ? "Free" : `${credit} cr`}
          </div>
        </button>
      ))}
    </div>
  );
}
