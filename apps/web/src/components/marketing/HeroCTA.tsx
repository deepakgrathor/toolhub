"use client";

import { useState } from "react";
import { ArrowRight, Zap, Sparkles } from "lucide-react";
import {
  FileText, Video, Image, Heading, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode,
  MessageCircle, Banknote, FileSearch, Briefcase,
  Mail, TrendingUp, Shield, Calculator, Table2,
  Gavel, Lock, AlertCircle, AtSign, Linkedin,
  BarChart2, BadgeDollarSign,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

// ── Hero CTA (left column — text content only) ────────────────────────────────

export function HeroCTA() {
  return (
    <div className="flex flex-col gap-6">

      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-2
        self-start px-3 py-1.5 rounded-full border
        border-primary/30 bg-primary/10 text-primary
        text-xs font-medium">
        <Zap className="h-3.5 w-3.5" />
        Built for India · Trusted by 500+ professionals
      </div>

      {/* H1 */}
      <h1 className="text-4xl md:text-6xl font-bold
        tracking-tight leading-tight text-foreground">
        Save 10 hours
        <br />this week.
        <br />
        <span className="text-primary">Every week.</span>
      </h1>

      {/* Subheadline */}
      <p className="text-lg text-muted-foreground
        max-w-lg leading-relaxed">
        27 AI tools built for Indian creators,
        businesses, HR teams, and legal professionals.
        One workspace. Start free — no card needed.
      </p>

      {/* CTA pair */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/?auth=signup"
          className="inline-flex items-center gap-2
            px-6 py-3 rounded-xl font-semibold text-sm
            bg-primary text-primary-foreground
            hover:opacity-90 transition-opacity"
        >
          Start free today
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="/tools"
          className="inline-flex items-center gap-2
            px-6 py-3 rounded-xl font-semibold text-sm
            border border-border text-foreground
            hover:bg-muted/50 transition-colors"
        >
          Explore tools
        </a>
      </div>

      {/* Social proof strip */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center">
          {["SP", "RK", "AM", "VG", "PS"].map((init) => (
            <div
              key={init}
              className="w-7 h-7 rounded-full
                bg-primary/10 border-2 border-background
                flex items-center justify-center
                text-[10px] font-bold text-primary
                -ml-2 first:ml-0"
            >
              {init}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Joined by 500+ Indian professionals
        </p>
      </div>

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

const CATEGORIES = [
  { id: "all",       label: "All Tools",  count: 27 },
  { id: "creator",   label: "Creator",    count: 6  },
  { id: "sme",       label: "SME",        count: 7  },
  { id: "hr",        label: "HR",         count: 5  },
  { id: "legal",     label: "Legal",      count: 5  },
  { id: "marketing", label: "Marketing",  count: 4  },
];

const TOOLS = [
  // Creator (6)
  { slug: "blog-generator",      name: "Blog Generator",      Icon: FileText,        category: "creator",   outcome: "Publish faster, rank higher",         isFree: false },
  { slug: "yt-script",           name: "YT Script Writer",    Icon: Video,           category: "creator",   outcome: "Script a video in 2 minutes",         isFree: false },
  { slug: "thumbnail-ai",        name: "Thumbnail AI",        Icon: Image,           category: "creator",   outcome: "Stop the scroll every time",          isFree: false },
  { slug: "title-generator",     name: "Title Generator",     Icon: Heading,         category: "creator",   outcome: "3× more clicks guaranteed",           isFree: false },
  { slug: "hook-writer",         name: "Hook Writer",         Icon: Zap,             category: "creator",   outcome: "First line that pulls readers in",    isFree: false },
  { slug: "caption-generator",   name: "Caption Generator",   Icon: MessageSquare,   category: "creator",   outcome: "Post without staring at a blank box", isFree: false },
  // SME (7)
  { slug: "gst-invoice",         name: "GST Invoice",         Icon: Receipt,         category: "sme",       outcome: "Invoice sent in under 60 seconds",    isFree: true  },
  { slug: "expense-tracker",     name: "Expense Tracker",     Icon: Wallet,          category: "sme",       outcome: "Know where every rupee went",         isFree: true  },
  { slug: "quotation-generator", name: "Quotation Generator", Icon: ClipboardList,   category: "sme",       outcome: "Win clients with clean quotes",       isFree: true  },
  { slug: "website-generator",   name: "Website Generator",   Icon: Globe,           category: "sme",       outcome: "Full website copy in one click",      isFree: false },
  { slug: "qr-generator",        name: "QR Generator",        Icon: QrCode,          category: "sme",       outcome: "Instant QR, no app needed",          isFree: true  },
  { slug: "gst-calculator",      name: "GST Calculator",      Icon: Calculator,      category: "sme",       outcome: "Right tax, zero confusion",           isFree: true  },
  { slug: "salary-slip",         name: "Salary Slip",         Icon: Banknote,        category: "sme",       outcome: "Salary slips done in seconds",        isFree: true  },
  // HR (5)
  { slug: "jd-generator",        name: "JD Generator",        Icon: Briefcase,       category: "hr",        outcome: "Hire faster with sharp JDs",          isFree: false },
  { slug: "resume-screener",     name: "Resume Screener",     Icon: FileSearch,      category: "hr",        outcome: "Shortlist in minutes, not hours",     isFree: false },
  { slug: "appraisal-draft",     name: "Appraisal Draft",     Icon: TrendingUp,      category: "hr",        outcome: "Fair reviews, written fast",          isFree: false },
  { slug: "policy-generator",    name: "Policy Generator",    Icon: Shield,          category: "hr",        outcome: "HR policies, zero legal risk",        isFree: false },
  { slug: "offer-letter",        name: "Offer Letter",        Icon: Mail,            category: "hr",        outcome: "Professional letters, every time",    isFree: true  },
  // Legal (5)
  { slug: "legal-notice",        name: "Legal Notice",        Icon: Gavel,           category: "legal",     outcome: "Dispute-ready in 5 minutes",          isFree: false },
  { slug: "nda-generator",       name: "NDA Generator",       Icon: Lock,            category: "legal",     outcome: "Protect your IP instantly",           isFree: false },
  { slug: "legal-disclaimer",    name: "Legal Disclaimer",    Icon: AlertCircle,     category: "legal",     outcome: "Stay compliant on every page",        isFree: false },
  { slug: "tds-sheet",           name: "TDS Sheet",           Icon: Table2,          category: "legal",     outcome: "TDS sorted, audit-ready",             isFree: true  },
  { slug: "whatsapp-bulk",       name: "WhatsApp Bulk",       Icon: MessageCircle,   category: "legal",     outcome: "Reach 100s with one template",        isFree: false },
  // Marketing (4)
  { slug: "ad-copy",             name: "Ad Copy",             Icon: BadgeDollarSign, category: "marketing", outcome: "Copy that converts, not confuses",    isFree: false },
  { slug: "email-subject",       name: "Email Subject",       Icon: AtSign,          category: "marketing", outcome: "Open rates that actually move",       isFree: false },
  { slug: "linkedin-bio",        name: "LinkedIn Bio",        Icon: Linkedin,        category: "marketing", outcome: "Profile that gets you hired",         isFree: false },
  { slug: "seo-auditor",         name: "SEO Auditor",         Icon: BarChart2,       category: "marketing", outcome: "Fix what Google penalises",           isFree: false },
];

export function ToolsShowcaseSection() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? TOOLS
      : TOOLS.filter((t) => t.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4">

      {/* Section header */}
      <div className="text-center mb-10">
        <span className="inline-block text-[10px] font-bold uppercase
          tracking-widest text-primary bg-primary/10 rounded-full
          px-3 py-1 mb-3">
          27 AI tools
        </span>
        <h2 className="text-3xl md:text-4xl font-bold
          text-foreground mb-3">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Pick a category or browse all 27 tools built for Indian professionals.
        </p>
      </div>

      {/* Category filter tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={
              activeCategory === cat.id
                ? "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap bg-primary text-primary-foreground"
                : "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3
        lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(({ slug, name, Icon, outcome, isFree }) => (
          <button
            key={slug}
            onClick={() => openAuthModal("signup")}
            className="group rounded-xl border border-border
              bg-card p-4 text-left
              hover:border-primary/40 hover:-translate-y-0.5
              hover:shadow-md hover:shadow-primary/5
              transition-all duration-200"
          >
            {/* Icon */}
            <div className="w-9 h-9 rounded-lg bg-primary/10
              flex items-center justify-center
              group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-primary" />
            </div>

            {/* Name */}
            <div className="text-sm font-semibold
              text-foreground mt-3 leading-tight">
              {name}
            </div>

            {/* Outcome */}
            <div className="text-xs text-muted-foreground
              mt-1 leading-relaxed">
              {outcome}
            </div>

            {/* Free / AI badge */}
            <div className="mt-3">
              {isFree ? (
                <span className="inline-flex items-center
                  text-[10px] font-medium px-1.5 py-0.5
                  rounded-full bg-emerald-500/10
                  text-emerald-600 dark:text-emerald-400">
                  Free
                </span>
              ) : (
                <span className="inline-flex items-center gap-1
                  text-[10px] text-primary/50">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Below grid */}
      <div className="mt-10 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Can&apos;t find what you need? More tools coming every month.
        </p>
        <a href="/tools" className="text-sm text-primary font-medium hover:underline">
          See the full roadmap →
        </a>
      </div>

    </div>
  );
}
