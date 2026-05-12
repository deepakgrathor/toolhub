import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import {
  Zap, ArrowRight, Check, X, ChevronDown,
  Sparkles, Building2, Users, Scale, Megaphone,
  FileText, Video, Image, Heading, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode,
  MessageCircle, Banknote, FileSearch, Briefcase,
  Mail, TrendingUp, Shield, Calculator, Table2,
  Gavel, Lock, AlertCircle, AtSign, Linkedin,
  BarChart2, BadgeDollarSign,
  Star, Clock, UserCheck, LogIn,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SetuLix — India Ka #1 AI Workspace for Every Business",
  description:
    "27 powerful AI tools for creators, businesses, HR teams, marketers & legal professionals. Save 10+ hours every week. Free to start. Made in India.",
};

// ── Static data ───────────────────────────────────────────────────────────────

const ALL_TOOLS = [
  // Creator
  { slug: "blog-generator",    name: "Blog Generator",      kit: "creator",   Icon: FileText,        desc: "SEO blogs in seconds",           credit: 3 },
  { slug: "yt-script",         name: "YT Script Writer",    kit: "creator",   Icon: Video,           desc: "Viral YouTube scripts",          credit: 3 },
  { slug: "thumbnail-ai",      name: "Thumbnail AI",        kit: "creator",   Icon: Image,           desc: "AI thumbnail generation",        credit: 5 },
  { slug: "title-generator",   name: "Title Generator",     kit: "creator",   Icon: Heading,         desc: "Click-worthy titles",            credit: 1 },
  { slug: "hook-writer",       name: "Hook Writer",         kit: "creator",   Icon: Zap,             desc: "Attention-grabbing hooks",       credit: 1 },
  { slug: "caption-generator", name: "Caption Generator",   kit: "creator",   Icon: MessageSquare,   desc: "Social media captions",          credit: 1 },
  // SME
  { slug: "gst-invoice",       name: "GST Invoice",         kit: "sme",       Icon: Receipt,         desc: "Professional GST invoices",      credit: 2 },
  { slug: "expense-tracker",   name: "Expense Tracker",     kit: "sme",       Icon: Wallet,          desc: "Smart expense summaries",        credit: 1 },
  { slug: "quotation-generator",name:"Quotation Generator", kit: "sme",       Icon: ClipboardList,   desc: "Professional quotations",        credit: 2 },
  { slug: "website-generator", name: "Website Generator",   kit: "sme",       Icon: Globe,           desc: "AI website copy generator",      credit: 4 },
  { slug: "qr-generator",      name: "QR Generator",        kit: "sme",       Icon: QrCode,          desc: "Custom QR codes instantly",      credit: 0 },
  { slug: "gst-calculator",    name: "GST Calculator",      kit: "sme",       Icon: Calculator,      desc: "Quick GST calculations",         credit: 0 },
  // HR
  { slug: "jd-generator",      name: "JD Generator",        kit: "hr",        Icon: Briefcase,       desc: "Job descriptions in minutes",    credit: 2 },
  { slug: "resume-screener",   name: "Resume Screener",     kit: "hr",        Icon: FileSearch,      desc: "AI resume shortlisting",         credit: 3 },
  { slug: "appraisal-draft",   name: "Appraisal Draft",     kit: "hr",        Icon: TrendingUp,      desc: "Performance appraisals",         credit: 2 },
  { slug: "policy-generator",  name: "Policy Generator",    kit: "hr",        Icon: Shield,          desc: "HR policy documents",            credit: 2 },
  { slug: "offer-letter",      name: "Offer Letter",        kit: "hr",        Icon: Mail,            desc: "Professional offer letters",     credit: 2 },
  { slug: "salary-slip",       name: "Salary Slip",         kit: "hr",        Icon: Banknote,        desc: "Salary slips in seconds",        credit: 1 },
  // Legal
  { slug: "legal-notice",      name: "Legal Notice",        kit: "ca-legal",  Icon: Gavel,           desc: "Draft legal notices fast",       credit: 3 },
  { slug: "nda-generator",     name: "NDA Generator",       kit: "ca-legal",  Icon: Lock,            desc: "Non-disclosure agreements",      credit: 3 },
  { slug: "legal-disclaimer",  name: "Legal Disclaimer",    kit: "ca-legal",  Icon: AlertCircle,     desc: "Website legal disclaimers",      credit: 2 },
  { slug: "tds-sheet",         name: "TDS Sheet",           kit: "ca-legal",  Icon: Table2,          desc: "TDS calculations & sheets",      credit: 1 },
  { slug: "whatsapp-bulk",     name: "WhatsApp Bulk",       kit: "ca-legal",  Icon: MessageCircle,   desc: "Bulk message templates",         credit: 1 },
  // Marketing
  { slug: "ad-copy",           name: "Ad Copy",             kit: "marketing", Icon: BadgeDollarSign, desc: "High-converting ad copy",        credit: 2 },
  { slug: "email-subject",     name: "Email Subject",       kit: "marketing", Icon: AtSign,          desc: "High open-rate subjects",        credit: 1 },
  { slug: "linkedin-bio",      name: "LinkedIn Bio",        kit: "marketing", Icon: Linkedin,        desc: "Professional LinkedIn bios",     credit: 2 },
  { slug: "seo-auditor",       name: "SEO Auditor",         kit: "marketing", Icon: BarChart2,       desc: "Quick SEO content audit",        credit: 3 },
];

const WHO_CARDS = [
  {
    kit: "creator",
    Icon: Sparkles,
    title: "Content Creator",
    desc: "Scripts, thumbnails, hooks, captions — sab kuch ek jagah",
    tools: ["Blog Generator", "YT Script", "Hook Writer", "Caption", "Thumbnail AI", "Title Gen"],
  },
  {
    kit: "sme",
    Icon: Building2,
    title: "Business Owner (SME)",
    desc: "GST invoice, quotation, expense tracking — free mein",
    tools: ["GST Invoice", "Quotation", "Expense Tracker", "QR Generator", "Website Gen", "GST Calc"],
  },
  {
    kit: "hr",
    Icon: Users,
    title: "HR Professional",
    desc: "JD, offer letter, appraisal, policy — minutes mein",
    tools: ["JD Generator", "Resume Screener", "Appraisal Draft", "Policy Gen", "Offer Letter"],
  },
  {
    kit: "ca-legal",
    Icon: Scale,
    title: "CA / Legal Pro",
    desc: "Legal notices, NDAs, disclaimers — AI se draft karo",
    tools: ["Legal Notice", "NDA Generator", "Legal Disclaimer", "TDS Sheet", "WhatsApp Bulk"],
  },
  {
    kit: "marketing",
    Icon: Megaphone,
    title: "Marketer",
    desc: "Ad copy, LinkedIn bio, email subjects — conversions badhao",
    tools: ["Ad Copy", "Caption Gen", "Email Subject", "LinkedIn Bio", "Hook Writer", "SEO Auditor"],
  },
];

const FEATURES = [
  {
    title: "Personalized Workspace",
    desc: "Signup karo, profession batao — AI tumhara workspace khud set karta hai. 27 tools, 5 kits, 1 platform.",
    badge: "Onboarding",
    visual: "workspace",
  },
  {
    title: "27 AI Tools",
    desc: "Ek subscription. 27 tools. Koi alag app nahi. Creator se leke CA tak — sab covered.",
    badge: "All-in-One",
    visual: "tools",
  },
  {
    title: "Credit System",
    desc: "Sirf use karo jo chahiye. Credits kabhi expire nahi hote. Free tools bhi hain — koi pressure nahi.",
    badge: "Flexible",
    visual: "credits",
  },
];

const COMPARISON = [
  { feature: "Indian Tools (GST, Legal)",  setulix: true,  chatgpt: false, jasper: false, copyai: false },
  { feature: "Hindi Support",              setulix: true,  chatgpt: "partial", jasper: false, copyai: false },
  { feature: "GST Invoice Generator",      setulix: true,  chatgpt: false, jasper: false, copyai: false },
  { feature: "Credits (no subscription)",  setulix: true,  chatgpt: false, jasper: false, copyai: false },
  { feature: "Free Tools Available",       setulix: true,  chatgpt: false, jasper: false, copyai: false },
  { feature: "Made in India",              setulix: true,  chatgpt: false, jasper: false, copyai: false },
  { feature: "Indian Payments (Razorpay)", setulix: true,  chatgpt: false, jasper: false, copyai: false },
  { feature: "Personalized AI Kit",        setulix: true,  chatgpt: false, jasper: false, copyai: false },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Content Creator, Delhi",
    avatar: "PS",
    quote: "SetuLix ne mera 3 ghante ka kaam 20 minute mein kar diya. Blog + thumbnail + hook sab ek jagah!",
  },
  {
    name: "Rajesh Kumar",
    role: "CA, Mumbai",
    avatar: "RK",
    quote: "GST invoice aur legal notices ab seconds mein ready. Clients bhi impressed hain. Best investment.",
  },
  {
    name: "Anjali Verma",
    role: "HR Manager, Bangalore",
    avatar: "AV",
    quote: "JD se offer letter tak — sab AI se. Hiring timeline 60% reduce ho gayi hamare liye.",
  },
];

const FAQS = [
  {
    q: "Kya yeh free hai?",
    a: "Haan! Signup pe free credits milte hain. QR generator, GST calculator jaise tools bilkul free hain. Credit-based tools ke liye sirf use karo.",
  },
  {
    q: "Credits kab expire hote hain?",
    a: "Kabhi nahi! Purchased credits permanent hain. Sirf signup bonus credits ki expiry hoti hai (30 din).",
  },
  {
    q: "Konse AI models use hote hain?",
    a: "GPT-4o, Claude 3.5, Gemini Flash — tool ke hisaab se best model automatically use hota hai. Admin se change bhi ho sakta hai.",
  },
  {
    q: "Kya data secure hai?",
    a: "Bilkul. Aapka data encrypted hai. Tool outputs ek defined time ke baad delete ho jaate hain. No third-party sharing.",
  },
  {
    q: "Hindi mein kaam karta hai?",
    a: "Haan! Input Hindi ya Hinglish mein de sakte ho. Output language choose kar sakte ho.",
  },
  {
    q: "Subscription cancel kar sakte hain?",
    a: "SetuLix mein subscription nahi hai! Sirf credits hain — jo use karo woh pay karo. Koi commitment nahi.",
  },
];

const STATS = [
  { value: "27+",    label: "AI Tools" },
  { value: "5",      label: "Purpose-built Kits" },
  { value: "Free",   label: "To Start" },
  { value: "10hr+",  label: "Saved Per Week" },
];

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

function CompareCell({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="h-5 w-5 text-green-500 mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-yellow-500 text-sm mx-auto block text-center">Partial</span>;
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

      {/* ══ SECTION 1 — HERO ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32 text-center">
        {/* Background grid + glow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,58,237,0.12),transparent)]" />
        <div
          className="absolute inset-0 -z-10 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.15) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="mx-auto max-w-4xl">
          <Badge className="mb-6">
            India Ka #1 AI Workspace
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
            Ek AI Workspace.{" "}
            <span className="text-primary">Sabka Kaam.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            27 powerful AI tools for creators, businesses, HR teams, marketers &amp; legal professionals.
            Save 10+ hours every week.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/api/auth/signin"
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              Start Free — No Card Needed <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/tools"
              className="flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              Explore Tools
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            500+ Indian businesses · 27 AI Tools · Made with love in India
          </p>
        </div>
      </section>

      {/* ══ SECTION 2 — STATS BAR ════════════════════════════════════════════ */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-4xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="text-3xl font-bold text-primary">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 3 — WHO IS IT FOR ════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-7xl mx-auto">
        <SectionHeading
          badge="5 Kits · 27 Tools"
          title="Kiske liye hai SetuLix?"
          subtitle="Creator ho, business owner ho, ya HR manager — SetuLix har professional ke liye banaya gaya hai."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {WHO_CARDS.map(({ Icon, title, desc, tools, kit }) => (
            <Link key={kit} href={`/kits/${kit === "ca-legal" ? "legal" : kit}`}>
              <div className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-full cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{desc}</p>
                <ul className="space-y-1">
                  {tools.slice(0, 4).map((t) => (
                    <li key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                      {t}
                    </li>
                  ))}
                  {tools.length > 4 && (
                    <li className="text-xs text-primary font-medium">+{tools.length - 4} more</li>
                  )}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ SECTION 4 — FEATURES ════════════════════════════════════════════ */}
      <section id="features" className="px-4 py-20 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="Why SetuLix"
            title="Features jo kaam aate hain"
            subtitle="Complex features nahi. Sirf woh jo tumhari zindagi asaan kare."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ title, desc, badge }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-colors">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-full px-2.5 py-1 mb-4">
                  {badge}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 5 — TOOLS SHOWCASE ══════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-7xl mx-auto">
        <SectionHeading
          badge="All Tools"
          title="27 Tools. 5 Categories. Ek Platform."
          subtitle="Explore karo saare tools — free se premium tak."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {ALL_TOOLS.map(({ slug, name, Icon, desc, credit }) => (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-150"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs font-semibold text-foreground mb-1 leading-tight">{name}</div>
              <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{desc}</div>
              <div className="mt-2 text-[10px] font-bold text-primary">
                {credit === 0 ? "Free" : `${credit} cr`}
              </div>
            </Link>
          ))}
        </div>
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
            title="Kaise kaam karta hai?"
            subtitle="30 seconds se shuru karo. Bilkul free."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { step: "01", Icon: LogIn,     title: "Sign Up Free",      desc: "30 second signup. Google ya email se. Koi credit card nahi." },
              { step: "02", Icon: UserCheck,  title: "Set Up Workspace",  desc: "Profession batao. AI tumhara personalized kit ready karta hai." },
              { step: "03", Icon: Zap,        title: "Start Creating",    desc: "Tool use karo. AI output pao. Credits deduct. Simple hai!" },
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
          badge="Comparison"
          title="Kyun SetuLix?"
          subtitle="India ke liye bana — Bharat ke liye."
        />
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Feature</th>
                <th className="px-4 py-3 font-bold text-primary">SetuLix</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">ChatGPT</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Jasper</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Copy.ai</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(({ feature, setulix, chatgpt, jasper, copyai }, i) => (
                <tr key={feature} className={i % 2 === 0 ? "bg-background" : "bg-card/40"}>
                  <td className="px-4 py-3 text-foreground">{feature}</td>
                  <td className="px-4 py-3 text-center"><CompareCell value={setulix} /></td>
                  <td className="px-4 py-3 text-center"><CompareCell value={chatgpt} /></td>
                  <td className="px-4 py-3 text-center"><CompareCell value={jasper} /></td>
                  <td className="px-4 py-3 text-center"><CompareCell value={copyai} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Proudly Indian. Built for Bharat.
        </p>
      </section>

      {/* ══ SECTION 8 — PRICING PREVIEW ═════════════════════════════════════ */}
      <section className="px-4 py-20 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            badge="Pricing"
            title="Simple. Transparent. Fair."
            subtitle="No subscriptions. Sirf use karo, credit deduct hoga."
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
          title="Real users. Real results."
          subtitle="Dekho kya kehte hain SetuLix users."
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
            title="Aapke sawaalon ke jawab"
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
            Abhi shuru karo — free mein
          </h2>
          <p className="text-primary-foreground/80 text-base mb-8">
            No credit card. No commitment. Sirf signup karo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/api/auth/signin"
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary hover:opacity-90 transition-opacity shadow-md"
            >
              Create Free Account <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/tools"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Explore Tools
            </Link>
          </div>
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
              &copy; 2025 SetuLabsAI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Designed &amp; Developed by SetuLabsAI · Founder &amp; CEO: Deepak Rathor · Made with love in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
