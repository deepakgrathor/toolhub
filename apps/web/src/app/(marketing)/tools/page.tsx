"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  Sparkles, Building2, Users, Scale, Megaphone,
  FileText, Video, Image, Heading, Zap, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode,
  MessageCircle, Banknote, FileSearch, Briefcase,
  Mail, TrendingUp, Shield, Calculator, Table2,
  Gavel, Lock, AlertCircle, AtSign, Linkedin,
  BarChart2, BadgeDollarSign, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_TOOLS = [
  { slug: "blog-generator",     name: "Blog Generator",       kit: "creator",   Icon: FileText,        desc: "SEO blogs in seconds",            credit: 3 },
  { slug: "yt-script",          name: "YT Script Writer",     kit: "creator",   Icon: Video,           desc: "Viral YouTube scripts",           credit: 3 },
  { slug: "thumbnail-ai",       name: "Thumbnail AI",         kit: "creator",   Icon: Image,           desc: "AI thumbnail generation",         credit: 5 },
  { slug: "title-generator",    name: "Title Generator",      kit: "creator",   Icon: Heading,         desc: "Click-worthy titles",             credit: 1 },
  { slug: "hook-writer",        name: "Hook Writer",          kit: "creator",   Icon: Zap,             desc: "Attention-grabbing hooks",        credit: 1 },
  { slug: "caption-generator",  name: "Caption Generator",    kit: "creator",   Icon: MessageSquare,   desc: "Social media captions",           credit: 1 },
  { slug: "gst-invoice",        name: "GST Invoice",          kit: "sme",       Icon: Receipt,         desc: "Professional GST invoices",       credit: 2 },
  { slug: "expense-tracker",    name: "Expense Tracker",      kit: "sme",       Icon: Wallet,          desc: "Smart expense summaries",         credit: 1 },
  { slug: "quotation-generator",name: "Quotation Generator",  kit: "sme",       Icon: ClipboardList,   desc: "Professional quotations",         credit: 2 },
  { slug: "website-generator",  name: "Website Generator",    kit: "sme",       Icon: Globe,           desc: "AI website copy generator",       credit: 4 },
  { slug: "qr-generator",       name: "QR Generator",         kit: "sme",       Icon: QrCode,          desc: "Custom QR codes instantly",       credit: 0 },
  { slug: "gst-calculator",     name: "GST Calculator",       kit: "sme",       Icon: Calculator,      desc: "Quick GST calculations",          credit: 0 },
  { slug: "jd-generator",       name: "JD Generator",         kit: "hr",        Icon: Briefcase,       desc: "Job descriptions in minutes",     credit: 2 },
  { slug: "resume-screener",    name: "Resume Screener",      kit: "hr",        Icon: FileSearch,      desc: "AI resume shortlisting",          credit: 3 },
  { slug: "appraisal-draft",    name: "Appraisal Draft",      kit: "hr",        Icon: TrendingUp,      desc: "Performance appraisals",          credit: 2 },
  { slug: "policy-generator",   name: "Policy Generator",     kit: "hr",        Icon: Shield,          desc: "HR policy documents",             credit: 2 },
  { slug: "offer-letter",       name: "Offer Letter",         kit: "hr",        Icon: Mail,            desc: "Professional offer letters",      credit: 2 },
  { slug: "salary-slip",        name: "Salary Slip",          kit: "hr",        Icon: Banknote,        desc: "Salary slips in seconds",         credit: 1 },
  { slug: "legal-notice",       name: "Legal Notice",         kit: "ca-legal",  Icon: Gavel,           desc: "Draft legal notices fast",        credit: 3 },
  { slug: "nda-generator",      name: "NDA Generator",        kit: "ca-legal",  Icon: Lock,            desc: "Non-disclosure agreements",       credit: 3 },
  { slug: "legal-disclaimer",   name: "Legal Disclaimer",     kit: "ca-legal",  Icon: AlertCircle,     desc: "Website legal disclaimers",       credit: 2 },
  { slug: "tds-sheet",          name: "TDS Sheet",            kit: "ca-legal",  Icon: Table2,          desc: "TDS calculations & sheets",       credit: 1 },
  { slug: "whatsapp-bulk",      name: "WhatsApp Bulk",        kit: "ca-legal",  Icon: MessageCircle,   desc: "Bulk message templates",          credit: 1 },
  { slug: "ad-copy",            name: "Ad Copy",              kit: "marketing", Icon: BadgeDollarSign, desc: "High-converting ad copy",         credit: 2 },
  { slug: "email-subject",      name: "Email Subject",        kit: "marketing", Icon: AtSign,          desc: "High open-rate subjects",         credit: 1 },
  { slug: "linkedin-bio",       name: "LinkedIn Bio",         kit: "marketing", Icon: Linkedin,        desc: "Professional LinkedIn bios",      credit: 2 },
  { slug: "seo-auditor",        name: "SEO Auditor",          kit: "marketing", Icon: BarChart2,       desc: "Quick SEO content audit",         credit: 3 },
];

const KITS = [
  { id: "all",      label: "All Tools", Icon: null },
  { id: "creator",  label: "Creator",   Icon: Sparkles },
  { id: "sme",      label: "SME",       Icon: Building2 },
  { id: "hr",       label: "HR",        Icon: Users },
  { id: "ca-legal", label: "CA/Legal",  Icon: Scale },
  { id: "marketing",label: "Marketing", Icon: Megaphone },
];

export default function MarketingToolsPage() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const [activeKit, setActiveKit] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = ALL_TOOLS.filter((t) => {
    const kitMatch = activeKit === "all" || t.kit === activeKit;
    const searchMatch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase());
    return kitMatch && searchMatch;
  });

  return (
    <div className="min-h-screen px-4 py-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          27 Tools
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          AI Tools for Every Indian Professional
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Creator se CA tak — 27 tools, 5 kits, ek platform.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Kit filter tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {KITS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveKit(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeKit === id
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(({ slug, name, Icon, desc, credit }) => (
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

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground mt-12">
          No tools found. Try a different search or filter.
        </p>
      )}

      {/* CTA */}
      <div className="mt-16 text-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 shadow-2xl shadow-primary/20">
        <h2 className="text-2xl font-bold text-white mb-2">Try all 27 tools free</h2>
        <p className="text-primary-foreground/80 mb-6">Sign up and get 10 free credits instantly.</p>
        <button
          onClick={() => openAuthModal("signup")}
          className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary hover:opacity-90 transition-opacity"
        >
          Start Free — No Card Needed
        </button>
      </div>
    </div>
  );
}
