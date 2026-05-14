import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { HeroCTA, FinalCTA, ToolsShowcaseSection } from "@/components/marketing/HeroCTA";
import { DeletedAccountToast } from "@/components/marketing/DeletedAccountToast";
import { PersonaJourney } from "@/components/marketing/PersonaJourney";
import { TrustedByStrip } from "@/components/marketing/TrustedByStrip";
import {
  Zap, ArrowRight, Check, X, ChevronDown,
  Sparkles, Building2, Users, Scale, Megaphone,
  Star, Clock, UserCheck, LogIn,
  TrendingUp, MapPin, Quote, CheckCircle,
  FileText, Receipt, ChevronRight,
} from "lucide-react";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SetuLix — AI Workspace for Indian Professionals",
  description:
    "27 AI tools for Indian creators, businesses, HR teams, and legal professionals. Save 10+ hours every week. Free to start — no card needed.",
};

// ── Static data ───────────────────────────────────────────────────────────────


const WHO_CARDS = [
  {
    kit: "creator",
    Icon: Sparkles,
    title: "Content Creator",
    desc: "Scripts, thumbnails, hooks, and captions — every content format, done in minutes.",
    outcome: "Save 6+ hours per video",
    tools: ["YT Script Writer", "Thumbnail AI", "Hook Writer", "Blog Generator", "Title Generator"],
    color: "violet",
  },
  {
    kit: "sme",
    Icon: Building2,
    title: "Business Owner",
    desc: "GST invoices, salary slips, quotations, and expense tracking — all free.",
    outcome: "Cut back-office time by 80%",
    tools: ["GST Invoice", "Salary Slip", "Quotation", "Expense Tracker", "TDS Sheet"],
    color: "blue",
  },
  {
    kit: "hr",
    Icon: Users,
    title: "HR Professional",
    desc: "JDs, offer letters, appraisals, and policies — built for solo and team HR.",
    outcome: "Hire 3x faster",
    tools: ["JD Generator", "Resume Screener", "Appraisal Draft", "Policy Generator"],
    color: "teal",
  },
  {
    kit: "legal",
    Icon: Scale,
    title: "CA & Legal Pro",
    desc: "Legal notices, NDAs, and disclaimers — AI-drafted, court-ready format.",
    outcome: "Handle 3x more clients",
    tools: ["Legal Notice", "NDA Generator", "GST Calculator", "Legal Disclaimer"],
    color: "amber",
  },
  {
    kit: "marketing",
    Icon: Megaphone,
    title: "Marketer & Agency",
    desc: "Ad copy, SEO audits, LinkedIn bios, and email subjects — campaigns done faster.",
    outcome: "Deliver more, with same team",
    tools: ["Ad Copy Writer", "SEO Auditor", "LinkedIn Bio", "Email Subject"],
    color: "pink",
  },
];

const FEATURES = [
  {
    icon: UserCheck,
    title: "Your personalized kit",
    desc: "Tell us your profession. SetuLix sets up a workspace with the tools you actually need — not 27 tabs of confusion.",
    badge: "Smart onboarding",
  },
  {
    icon: Zap,
    title: "AI tools that work for India",
    desc: "GST invoices, legal notices, Hindi-friendly scripts — built for how Indian professionals actually work.",
    badge: "Built for India",
  },
  {
    icon: Clock,
    title: "Pay only for what you use",
    desc: "No forced subscriptions. Start free. Buy credits when you need more. SME tools are free forever.",
    badge: "Flexible pricing",
  },
];

const COMPETITORS = ["SetuLix", "ChatGPT", "Canva", "Vyapar", "Jasper"];

const COMPARISON: {
  feature: string;
  values: (boolean | "partial")[];
}[] = [
  { feature: "GST Invoice & TDS Sheet",
    values: [true, false, false, true, false] },
  { feature: "Legal Notice & NDA Generator",
    values: [true, "partial", false, false, false] },
  { feature: "YouTube Scripts & Hooks",
    values: [true, "partial", false, false, true] },
  { feature: "HR — JD & Resume Screening",
    values: [true, "partial", false, false, false] },
  { feature: "Indian payments (UPI/Paygic)",
    values: [true, false, false, true, false] },
  { feature: "Free tools — no login needed",
    values: [true, false, "partial", "partial", false] },
  { feature: "Pay-per-use credits",
    values: [true, false, false, false, false] },
  { feature: "Profession-specific kits",
    values: [true, false, "partial", false, false] },
  { feature: "Built specifically for India",
    values: [true, false, false, true, false] },
];

const TESTIMONIALS = [
  {
    name: "Sneha Patil",
    role: "HR Manager",
    city: "Pune",
    avatar: "SP",
    color: "teal",
    stat: "Saved 38 hrs/month",
    quote: "I was the only HR at a 12-person startup with three open roles. Writing JDs alone took my entire Monday. With SetuLix, I get a complete JD in 6 minutes, my shortlist is ranked before lunch, and my offer letters are error-free every time.",
    featured: true,
  },
  {
    name: "Rahul Khanna",
    role: "Finance YouTuber · 180K subscribers",
    city: "Delhi",
    avatar: "RK",
    color: "violet",
    stat: "9 videos/month vs 4",
    quote: "I was paying ₹4,000 a month just for thumbnails. SetuLix cut that to under ₹200. The YT Script Writer gave me my Monday mornings back. My upload consistency went from broken to 100%.",
    featured: false,
  },
  {
    name: "Adv. Anjali Mehta",
    role: "Practicing Advocate",
    city: "Mumbai",
    avatar: "AM",
    color: "amber",
    stat: "22 clients vs 8",
    quote: "A legal notice used to take me four hours. I was turning away clients not because I lacked skill, but because I had no time. SetuLix drafts in 10 minutes. I review and send.",
    featured: false,
  },
  {
    name: "Vikram Gupta",
    role: "Wholesale Business Owner",
    city: "Surat",
    avatar: "VG",
    color: "blue",
    stat: "Saved ₹3,000/month",
    quote: "I was paying my accountant ₹3,000 a month just for invoicing. Now I generate error-free GST invoices in 3 minutes, salary slips in 20. No accountant. No Tally. No stress.",
    featured: false,
  },
  {
    name: "Priya Sharma",
    role: "Agency Founder · 3-person team",
    city: "Bangalore",
    avatar: "PS",
    color: "pink",
    stat: "11 clients vs 4",
    quote: "My team was maxed at 4 clients. Ad copy alone took 3 hours per client. I turned away two new clients in one quarter — not because we didn't want the work, but because there was no capacity. SetuLix changed that.",
    featured: false,
  },
];

const FAQS = [
  {
    q: "What is the difference between a plan and credits?",
    a: "Plans give you a monthly credit allowance — LITE: 200cr, PRO: 700cr, BUSINESS: 1500cr — plus benefits like output history and branded PDF downloads. Credit packs are one-time top-ups with no expiry. You can mix both.",
  },
  {
    q: "What can I use for free without paying anything?",
    a: "All SME tools — GST Invoice, Salary Slip, Expense Tracker, Quotation Generator, TDS Sheet, and QR Generator — are completely free, forever. You also get 10 free credits on signup to try any AI tool.",
  },
  {
    q: "Do credits expire?",
    a: "Purchased credit packs never expire. Monthly plan credits roll over based on your plan — LITE: 1 month, PRO: 2 months, BUSINESS: 3 months. Signup bonus credits are valid for 30 days.",
  },
  {
    q: "Is my data safe? Who can see my outputs?",
    a: "Your outputs are private to your account. We do not share or sell your data. Output history is retained based on your plan (FREE: not stored, LITE: 30 days, PRO: 90 days, BUSINESS: 1 year) and then permanently deleted.",
  },
  {
    q: "Can I cancel my plan anytime?",
    a: "Yes. Plans are monthly or annual — no lock-in contracts. If you cancel, you keep access until your billing period ends. Credit pack credits are yours to keep regardless.",
  },
  {
    q: "Which AI models does SetuLix use?",
    a: "Each tool uses the model best suited for its task — Claude Sonnet for legal documents and NDAs, GPT-4o for SEO audits, Gemini Flash for captions and hooks, and DALL-E 3 for thumbnails. You always get the best output, not the cheapest model.",
  },
  {
    q: "Do I get a GST invoice for my purchase?",
    a: "Yes. A proper GST tax invoice (CGST + SGST breakdown) is automatically generated after every payment and emailed to you. Add your GSTIN at checkout for business billing.",
  },
  {
    q: "What happens when I run out of credits mid-month?",
    a: "Buy a credit pack anytime — no need to upgrade your plan or wait for the month to reset. Credit packs stack on top of your monthly allowance and never expire.",
  },
];

const STATS = [
  { value: "27+", label: "AI Tools" },
  { value: "5",   label: "Profession Kits" },
  { value: "10s", label: "To first output" },
  { value: "₹0",  label: "To get started" },
];

// ── Kit color map (complete class strings — never interpolate) ─────────────────

const KIT_COLOR_MAP: Record<string, {
  iconBg   : string
  iconText : string
  chipBg   : string
  chipText : string
  chipBorder: string
}> = {
  violet: {
    iconBg   : "bg-violet-500/10",
    iconText : "text-violet-600 dark:text-violet-400",
    chipBg   : "bg-violet-500/10",
    chipText : "text-violet-700 dark:text-violet-300",
    chipBorder: "border-violet-500/20",
  },
  blue: {
    iconBg   : "bg-blue-500/10",
    iconText : "text-blue-600 dark:text-blue-400",
    chipBg   : "bg-blue-500/10",
    chipText : "text-blue-700 dark:text-blue-300",
    chipBorder: "border-blue-500/20",
  },
  teal: {
    iconBg   : "bg-teal-500/10",
    iconText : "text-teal-600 dark:text-teal-400",
    chipBg   : "bg-teal-500/10",
    chipText : "text-teal-700 dark:text-teal-300",
    chipBorder: "border-teal-500/20",
  },
  amber: {
    iconBg   : "bg-amber-500/10",
    iconText : "text-amber-600 dark:text-amber-400",
    chipBg   : "bg-amber-500/10",
    chipText : "text-amber-700 dark:text-amber-300",
    chipBorder: "border-amber-500/20",
  },
  pink: {
    iconBg   : "bg-pink-500/10",
    iconText : "text-pink-600 dark:text-pink-400",
    chipBg   : "bg-pink-500/10",
    chipText : "text-pink-700 dark:text-pink-300",
    chipBorder: "border-pink-500/20",
  },
}

// ── Components ────────────────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary ${className}`}>
      {children}
    </span>
  );
}

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      {badge && <Badge className="mb-4">{badge}</Badge>}
      <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">{title}</h2>
      {subtitle && <p className="text-muted-foreground text-base">{subtitle}</p>}
    </div>
  );
}

function CompareCell({
  value,
  highlight = false,
}: {
  value: boolean | "partial"
  highlight?: boolean
}) {
  if (value === true) {
    return (
      <Check
        className={cn(
          "h-4 w-4 mx-auto",
          highlight ? "text-primary" : "text-green-500"
        )}
      />
    )
  }
  if (value === false) {
    return (
      <X className="h-4 w-4 mx-auto
        text-muted-foreground/30" />
    )
  }
  return (
    <span className="text-[11px] font-medium
      text-amber-600 dark:text-amber-400">
      Partial
    </span>
  )
}

// ── Accordion FAQ ─────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-border rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-muted/40 transition-colors">
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-sm text-muted-foreground">{a}</div>
    </details>
  );
}

// ── Kit filter tabs (client island would be cleaner, but static works too) ───

// ── Main export ───────────────────────────────────────────────────────────────

export default async function MarketingHomePage() {
  // Logged-in users go straight to the app
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="overflow-x-hidden">
      <DeletedAccountToast />

      {/* ══ SECTION 1 — HERO ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden
        px-4 pt-24 pb-20 md:pt-32 md:pb-28">

        {/* Background: radial purple glow */}
        <div className="absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.15), transparent)"
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border,#e5e7eb) 1px, transparent 1px), linear-gradient(90deg, var(--color-border,#e5e7eb) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2
            gap-12 lg:gap-16 items-center">

            {/* Left: text content */}
            <HeroCTA />

            {/* Right: visual mockup */}
            <div className="rounded-2xl border border-border
              bg-card shadow-xl p-5 lg:ml-auto w-full
              max-w-md">

              {/* Header row */}
              <div className="flex items-center
                justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full
                    bg-primary" />
                  <span className="text-sm font-medium
                    text-foreground">SetuLix AI</span>
                </div>
                <div className="flex items-center gap-1.5
                  text-xs text-green-600
                  dark:text-green-400">
                  <div className="w-1.5 h-1.5 rounded-full
                    bg-green-500 animate-pulse" />
                  generating...
                </div>
              </div>

              {/* Tool preview cards */}
              {[
                {
                  icon: FileText,
                  name: "JD Generator",
                  stat: "6 min vs 3 hrs",
                },
                {
                  icon: Scale,
                  name: "Legal Notice",
                  stat: "10 min vs 4 hrs",
                },
                {
                  icon: Receipt,
                  name: "GST Invoice",
                  stat: "3 min · Free",
                },
              ].map(({ icon: Icon, name, stat }) => (
                <div
                  key={name}
                  className="flex items-center
                    justify-between bg-muted/50
                    rounded-lg p-3 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5
                      text-primary shrink-0" />
                    <span className="text-xs font-medium
                      text-foreground">{name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5
                    rounded-full bg-primary/10
                    text-primary font-medium shrink-0">
                    {stat}
                  </span>
                </div>
              ))}

              {/* Footer row */}
              <div className="flex items-center gap-2
                mt-4 pt-3 border-t border-border">
                <CheckCircle className="h-3.5 w-3.5
                  text-green-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Credits deducted only after
                  successful output
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2 — STATS BAR ════════════════════════════════════════════ */}
      <section className="border-y border-border
        bg-card/40">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4
            gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}
                className="flex flex-col
                  items-center gap-1.5">
                <div className="text-3xl md:text-4xl
                  font-bold text-primary tabular-nums">
                  {value}
                </div>
                <div className="text-xs font-medium
                  text-muted-foreground uppercase
                  tracking-wide">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUSTED BY STRIP ════════════════════════════════════════════════ */}
      <TrustedByStrip />

      {/* ══ SECTION 3 — WHO IS IT FOR ════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-7xl mx-auto">

        <div className="text-center mb-10">
          <span className="inline-block text-[10px]
            font-bold uppercase tracking-widest
            text-primary bg-primary/10 rounded-full
            px-3 py-1 mb-3">
            5 Profession Kits
          </span>
          <h2 className="text-3xl md:text-4xl font-bold
            text-foreground mb-3">
            Built for every Indian professional
          </h2>
          <p className="text-base text-muted-foreground
            max-w-xl mx-auto">
            Pick your kit. Get a workspace with the tools
            you actually need — not 27 tabs of confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-3 xl:grid-cols-5 gap-4">

          {WHO_CARDS.map(({ kit, Icon, title, desc,
                            outcome, tools, color }) => {
            const c = KIT_COLOR_MAP[color]
            return (
              <Link
                key={kit}
                href={`/kits/${kit}`}
                className="group rounded-2xl border
                  border-border bg-card p-5 h-full
                  hover:border-primary/30
                  hover:shadow-md hover:shadow-primary/5
                  transition-all duration-200
                  flex flex-col gap-4"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl
                  flex items-center justify-center
                  ${c.iconBg} transition-colors`}>
                  <Icon className={`h-5 w-5 ${c.iconText}`} />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h3 className="text-sm font-bold
                    text-foreground mb-1">{title}</h3>
                  <p className="text-xs
                    text-muted-foreground
                    leading-relaxed">{desc}</p>
                </div>

                {/* Outcome chip */}
                <div className={`inline-flex items-center
                  gap-1.5 text-[11px] font-medium
                  px-2.5 py-1 rounded-full border
                  self-start ${c.chipBg} ${c.chipText}
                  ${c.chipBorder}`}>
                  <TrendingUp className="h-3 w-3" />
                  {outcome}
                </div>

                {/* Tool pills — top 3 + overflow count */}
                <div className="flex flex-wrap
                  gap-1.5 mt-auto">
                  {tools.slice(0, 3).map(t => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5
                        rounded-full bg-muted
                        text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                  {tools.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5
                      rounded-full bg-muted
                      text-primary font-medium">
                      +{tools.length - 3} more
                    </span>
                  )}
                </div>

              </Link>
            )
          })}

        </div>
      </section>

      {/* ══ SECTION 4 — FEATURES ════════════════════════════════════════════ */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Heading */}
          <div className="text-center mb-12">
            <span className="inline-block text-[10px]
              font-bold uppercase tracking-widest
              text-primary bg-primary/10 rounded-full
              px-3 py-1 mb-3">
              Why SetuLix
            </span>
            <h2 className="text-3xl md:text-4xl font-bold
              text-foreground mb-3">
              One workspace. Everything you need.
            </h2>
            <p className="text-base text-muted-foreground
              max-w-xl mx-auto">
              Not a generic AI tool. A workspace built
              around how Indian professionals actually work.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1
            md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title,
                             desc, badge }) => (
              <div
                key={title}
                className="rounded-2xl border border-border
                  bg-card p-6 flex flex-col gap-4
                  hover:border-primary/20
                  transition-colors"
              >
                <div className="w-11 h-11 rounded-xl
                  bg-primary/10 flex items-center
                  justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <span className="text-[10px] font-bold
                  uppercase tracking-widest text-primary
                  bg-primary/10 rounded-full px-2.5 py-1
                  self-start">
                  {badge}
                </span>

                <h3 className="text-base font-bold
                  text-foreground">{title}</h3>

                <p className="text-sm text-muted-foreground
                  leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══ SECTION 4B — PERSONA JOURNEYS ═══════════════════════════════════ */}
      <div className="border-t border-border" />
      <PersonaJourney />
      <div className="border-t border-border" />

      {/* ══ SECTION 5 — TOOLS SHOWCASE ══════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-7xl mx-auto">
        <SectionHeading
          badge="All Tools"
          title="27 tools. 5 categories. One platform."
          subtitle="Browse all tools — free and AI-powered."
        />
        <ToolsShowcaseSection />
        <div className="mt-8 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            Explore All Tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ══ SECTION 6 — HOW IT WORKS ════════════════════════════════════════ */}
      <section className="px-4 py-20 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            badge="3 Steps"
            title="How it works"
            subtitle="Up and running in under a minute. Free."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { step: "01", Icon: LogIn,     title: "Sign Up Free",      desc: "30-second signup. Google or email. No card required." },
              { step: "02", Icon: UserCheck,  title: "Set Up Workspace",  desc: "Tell us your profession. We set up a personalized workspace for you." },
              { step: "03", Icon: Zap,        title: "Start Creating",    desc: "Pick a tool. Get your output. Credits deduct only on success." },
            ].map(({ step, Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  <Icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 7 — COMPARISON TABLE ════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <SectionHeading
          badge="How SetuLix compares"
          title="Built specifically for Indian professionals."
          subtitle="Most tools are built for a global audience. SetuLix is built for how India works."
        />
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm
                  font-semibold text-foreground w-[35%]">
                  Feature
                </th>
                {COMPETITORS.map((name, i) => (
                  <th
                    key={name}
                    className={cn(
                      "px-4 py-3 text-sm font-semibold text-center",
                      i === 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {i === 0 ? (
                      <span className="flex flex-col
                        items-center gap-1">
                        {name}
                        <span className="text-[9px] font-medium
                          bg-primary/10 text-primary rounded-full
                          px-2 py-0.5">
                          ← Us
                        </span>
                      </span>
                    ) : (
                      name
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(({ feature, values }, rowIdx) => (
                <tr
                  key={feature}
                  className={rowIdx % 2 === 0
                    ? "bg-background"
                    : "bg-muted/20"}
                >
                  <td className="px-4 py-3 text-sm
                    text-foreground">{feature}</td>
                  {values.map((val, colIdx) => (
                    <td key={colIdx}
                      className="px-4 py-3 text-center">
                      <CompareCell
                        value={val}
                        highlight={colIdx === 0}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs
          text-muted-foreground mt-4 italic">
          Each tool serves a different purpose.
          SetuLix is built specifically for
          Indian professionals.
        </p>
      </section>

      {/* ══ SECTION 8 — PRICING PREVIEW ═════════════════════════════════════ */}
      <section className="px-4 py-20 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            badge="Pricing"
            title="Simple, transparent pricing."
            subtitle="Start free. Upgrade when you need more."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                credits: 100,
                price: "₹99",
                highlight: false,
                perks: ["100 Credits", "All 27 tools access", "Credits never expire", "Email support"],
              },
              {
                name: "Growth",
                credits: 500,
                price: "₹399",
                highlight: true,
                perks: ["500 Credits", "All 27 tools access", "Credits never expire", "Priority support", "Save 20%"],
              },
              {
                name: "Pro",
                credits: 1500,
                price: "₹999",
                highlight: false,
                perks: ["1500 Credits", "All 27 tools access", "Credits never expire", "Priority support", "Save 33%"],
              },
            ].map(({ name, price, highlight, perks }) => (
              <div
                key={name}
                className={`rounded-2xl border p-6 ${highlight ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card"}`}
              >
                {highlight && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-full px-2.5 py-1 mb-3">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground mb-1">{name}</h3>
                <div className="text-3xl font-bold text-foreground mb-4">{price}</div>
                <ul className="space-y-2 mb-6">
                  {perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`block w-full text-center rounded-xl py-2.5 text-sm font-semibold transition-opacity ${highlight ? "bg-primary text-white hover:opacity-90" : "border border-border text-foreground hover:bg-muted/50"}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-sm text-primary hover:underline font-medium">
              See all plans and compare →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ SECTION 9 — TESTIMONIALS ═════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <SectionHeading
          badge="Testimonials"
          title="Real people. Real results."
          subtitle="What Indian professionals say about SetuLix."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, avatar, quote }) => (
            <div key={name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4 italic">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 10 — FAQ ═════════════════════════════════════════════════ */}
      <section className="px-4 py-20 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <SectionHeading
            badge="FAQ"
            title="Frequently asked questions"
          />
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <FaqItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 11 — FINAL CTA ═══════════════════════════════════════════ */}
      <section className="px-4 py-24">
        <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 text-center shadow-2xl shadow-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Your AI workspace is ready.
          </h2>
          <p className="text-primary-foreground/80 text-base mb-8">
            Start free today. No card. No commitment.
          </p>
          <FinalCTA />
        </div>
      </section>

      {/* ══ SECTION 12 — FOOTER ═══════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-card/50 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="18" height="8" rx="3" fill="#7c3aed" />
                  <rect x="10" y="12" width="18" height="8" rx="3" fill="#7c3aed" opacity="0.7" />
                  <rect x="4" y="20" width="18" height="8" rx="3" fill="#7c3aed" />
                </svg>
                <span className="font-bold text-foreground">Setu<span className="text-primary">Lix</span></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI workspace for every Indian professional. 27 tools. 5 kits. One platform.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Product</h4>
              <ul className="space-y-2">
                {[["Tools", "/tools"], ["Pricing", "/pricing"], ["About", "/about"]].map(([l, h]) => (
                  <li key={h}><Link href={h} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Kits</h4>
              <ul className="space-y-2">
                {[["Creator", "/kits/creator"], ["SME", "/kits/sme"], ["HR", "/kits/hr"], ["Legal", "/kits/legal"], ["Marketing", "/kits/marketing"]].map(([l, h]) => (
                  <li key={h}><Link href={h} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Company</h4>
              <ul className="space-y-2">
                {[["About", "/about"], ["Contact", "mailto:hello@setulix.com"]].map(([l, h]) => (
                  <li key={h}><Link href={h} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 SetuLabsAI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Designed &amp; built by SetuLabsAI · Founder &amp; CEO: Deepak Rathor · Made in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
