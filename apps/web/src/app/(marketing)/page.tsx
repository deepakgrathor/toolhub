import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { HeroCTA, FinalCTA } from "@/components/marketing/HeroCTA";
import { DeletedAccountToast } from "@/components/marketing/DeletedAccountToast";
import { PersonaJourney } from "@/components/marketing/PersonaJourney";
import { TrustedByStrip } from "@/components/marketing/TrustedByStrip";
import { AuthModalOpener } from "@/components/marketing/AuthModalOpener";
import { TestimonialsCarousel } from "@/components/marketing/TestimonialsCarousel";
import { PricingPage } from "@/components/pricing/PricingPage";
import type {
  Plan,
  CreditPackData,
  RolloverConfig,
} from "@/components/pricing/PricingPage";
import {
  connectDB,
  Plan as PlanModel,
  CreditPack,
  SiteConfig,
} from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import {
  ArrowRight,
  Check,
  X,
  Sparkles,
  Building2,
  Users,
  Scale,
  Megaphone,
  Clock,
  TrendingUp,
  CheckCircle2,
  FileText,
  Receipt,
  ChevronRight,
  UserPlus,
  LayoutGrid,
  Wand2,
  Download,
  Minus,
  Cpu,
  Coins,
  Gavel,
  CheckCircle,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SetuLix — AI Workspace for Indian Professionals",
  description:
    "27 AI tools for Indian creators, businesses, HR teams, and legal professionals. Save 10+ hours every week. Free to start — no card needed.",
};

// ── DB helpers (same as /pricing/page.tsx) ─────────────────────────────────────

async function fetchPlans(): Promise<Plan[]> {
  try {
    try {
      const redis = getRedis();
      const cached = await redis.get("plans:public");
      if (cached) {
        const parsed = JSON.parse(cached as string) as Plan[];
        if (parsed.length > 0) return parsed;
        await redis.del("plans:public");
      }
    } catch {
      /* Redis unavailable */
    }

    await connectDB();
    const plans = await PlanModel.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    const withSavings = plans.map((p) => ({
      ...p,
      yearlySavings:
        (p.pricing.monthly.basePrice - p.pricing.yearly.basePrice) * 12,
    }));

    try {
      const redis = getRedis();
      await redis.set("plans:public", JSON.stringify(withSavings), { ex: 600 });
    } catch {
      /* silent */
    }

    return withSavings as unknown as Plan[];
  } catch {
    return [];
  }
}

async function fetchPacks(): Promise<CreditPackData[]> {
  try {
    try {
      const redis = getRedis();
      const cached = await redis.get("credit-packs:public");
      if (cached) return JSON.parse(cached as string) as CreditPackData[];
    } catch {
      /* Redis unavailable */
    }

    await connectDB();
    const packs = await CreditPack.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    try {
      const redis = getRedis();
      await redis.set("credit-packs:public", JSON.stringify(packs), {
        ex: 600,
      });
    } catch {
      /* silent */
    }

    return packs as unknown as CreditPackData[];
  } catch {
    return [];
  }
}

async function fetchRollover(): Promise<RolloverConfig> {
  try {
    try {
      const redis = getRedis();
      const cached = await redis.get("site-config:rollover");
      if (cached) return JSON.parse(cached as string) as RolloverConfig;
    } catch {
      /* Redis unavailable */
    }

    await connectDB();
    const [enabledDoc, daysDoc] = await Promise.all([
      SiteConfig.findOne({ key: "credit_rollover_enabled" }).lean(),
      SiteConfig.findOne({ key: "credit_rollover_days" }).lean(),
    ]);
    const result: RolloverConfig = {
      enabled: (enabledDoc?.value as boolean) ?? false,
      maxDays: (daysDoc?.value as number) ?? 30,
    };

    try {
      const redis = getRedis();
      await redis.set("site-config:rollover", JSON.stringify(result), {
        ex: 300,
      });
    } catch {
      /* silent */
    }

    return result;
  } catch {
    return { enabled: false, maxDays: 30 };
  }
}

// ── Static data ────────────────────────────────────────────────────────────────

const WHO_CARDS = [
  {
    kit: "creator",
    Icon: Sparkles,
    title: "Content Creator",
    desc: "Scripts, thumbnails, hooks, and captions — every content format, done in minutes.",
    outcome: "Save 6+ hours per video",
    tools: [
      "YT Script Writer",
      "Thumbnail AI",
      "Hook Writer",
      "Blog Generator",
      "Title Generator",
    ],
    color: "violet",
  },
  {
    kit: "sme",
    Icon: Building2,
    title: "Business Owner",
    desc: "GST invoices, salary slips, quotations, and expense tracking — all free.",
    outcome: "Cut back-office time by 80%",
    tools: [
      "GST Invoice",
      "Salary Slip",
      "Quotation",
      "Expense Tracker",
      "TDS Sheet",
    ],
    color: "blue",
  },
  {
    kit: "hr",
    Icon: Users,
    title: "HR Professional",
    desc: "JDs, offer letters, appraisals, and policies — built for solo and team HR.",
    outcome: "Hire 3x faster",
    tools: [
      "JD Generator",
      "Resume Screener",
      "Appraisal Draft",
      "Policy Generator",
    ],
    color: "teal",
  },
  {
    kit: "legal",
    Icon: Scale,
    title: "CA & Legal Pro",
    desc: "Legal notices, NDAs, and disclaimers — AI-drafted, court-ready format.",
    outcome: "Handle 3x more clients",
    tools: [
      "Legal Notice",
      "NDA Generator",
      "GST Calculator",
      "Legal Disclaimer",
    ],
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

const COMPETITORS = ["SetuLix", "ChatGPT", "Canva", "Vyapar", "Jasper"];

const COMPARISON: {
  feature: string;
  values: (boolean | "partial")[];
}[] = [
  {
    feature: "GST Invoice & TDS Sheet",
    values: [true, false, false, true, false],
  },
  {
    feature: "Legal Notice & NDA Generator",
    values: [true, "partial", false, false, false],
  },
  {
    feature: "YouTube Scripts & Hooks",
    values: [true, "partial", false, false, true],
  },
  {
    feature: "HR — JD & Resume Screening",
    values: [true, "partial", false, false, false],
  },
  {
    feature: "Indian payments (UPI/Paygic)",
    values: [true, false, false, true, false],
  },
  {
    feature: "Free tools — no login needed",
    values: [true, false, "partial", "partial", false],
  },
  {
    feature: "Pay-per-use credits",
    values: [true, false, false, false, false],
  },
  {
    feature: "Profession-specific kits",
    values: [true, false, "partial", false, false],
  },
  {
    feature: "Built specifically for India",
    values: [true, false, false, true, false],
  },
  {
    feature: "Hindi + English interface",
    values: [true, false, false, false, false],
  },
  {
    feature: "Indian tax tools (GST, TDS)",
    values: [true, false, false, true, false],
  },
  { feature: "Starts at ₹0", values: [true, false, true, false, true] },
];

const TESTIMONIALS = [
  {
    name: "Sneha Patil",
    role: "HR Manager",
    city: "Pune",
    avatar: "SP",
    color: "teal",
    stat: "Saved 38 hrs/month",
    quote:
      "I was the only HR at a 12-person startup with three open roles. Writing JDs alone took my entire Monday. With SetuLix, I get a complete JD in 6 minutes, my shortlist is ranked before lunch, and my offer letters are error-free every time.",
    featured: true,
  },
  {
    name: "Rahul Khanna",
    role: "Finance YouTuber · 180K subscribers",
    city: "Delhi",
    avatar: "RK",
    color: "violet",
    stat: "9 videos/month vs 4",
    quote:
      "I was paying ₹4,000 a month just for thumbnails. SetuLix cut that to under ₹200. The YT Script Writer gave me my Monday mornings back. My upload consistency went from broken to 100%.",
    featured: false,
  },
  {
    name: "Adv. Anjali Mehta",
    role: "Practicing Advocate",
    city: "Mumbai",
    avatar: "AM",
    color: "amber",
    stat: "22 clients vs 8",
    quote:
      "A legal notice used to take me four hours. I was turning away clients not because I lacked skill, but because I had no time. SetuLix drafts in 10 minutes. I review and send.",
    featured: false,
  },
  {
    name: "Vikram Gupta",
    role: "Wholesale Business Owner",
    city: "Surat",
    avatar: "VG",
    color: "blue",
    stat: "Saved ₹3,000/month",
    quote:
      "I was paying my accountant ₹3,000 a month just for invoicing. Now I generate error-free GST invoices in 3 minutes, salary slips in 20. No accountant. No Tally. No stress.",
    featured: false,
  },
  {
    name: "Priya Sharma",
    role: "Agency Founder · 3-person team",
    city: "Bangalore",
    avatar: "PS",
    color: "pink",
    stat: "11 clients vs 4",
    quote:
      "My team was maxed at 4 clients. Ad copy alone took 3 hours per client. I turned away two new clients in one quarter — not because we didn't want the work, but because there was no capacity. SetuLix changed that.",
    featured: false,
  },
];

const STATS = [
  { value: "27+", label: "AI Tools" },
  { value: "5", label: "Profession Kits" },
  { value: "10s", label: "To first output" },
  { value: "₹0", label: "To get started" },
];

// ── Kit color map ─────────────────────────────────────────────────────────────

const KIT_COLOR_MAP: Record<
  string,
  {
    iconBg: string;
    iconText: string;
    chipBg: string;
    chipText: string;
    chipBorder: string;
  }
> = {
  violet: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-600 dark:text-violet-400",
    chipBg: "bg-violet-500/10",
    chipText: "text-violet-700 dark:text-violet-300",
    chipBorder: "border-violet-500/20",
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
    chipBg: "bg-blue-500/10",
    chipText: "text-blue-700 dark:text-blue-300",
    chipBorder: "border-blue-500/20",
  },
  teal: {
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-600 dark:text-teal-400",
    chipBg: "bg-teal-500/10",
    chipText: "text-teal-700 dark:text-teal-300",
    chipBorder: "border-teal-500/20",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
    chipBg: "bg-amber-500/10",
    chipText: "text-amber-700 dark:text-amber-300",
    chipBorder: "border-amber-500/20",
  },
  pink: {
    iconBg: "bg-pink-500/10",
    iconText: "text-pink-600 dark:text-pink-400",
    chipBg: "bg-pink-500/10",
    chipText: "text-pink-700 dark:text-pink-300",
    chipBorder: "border-pink-500/20",
  },
};

// ── Components ────────────────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-base">{subtitle}</p>
      )}
    </div>
  );
}

function CompareCell({
  value,
  highlight = false,
}: {
  value: boolean | "partial";
  highlight?: boolean;
}) {
  if (value === true) {
    return highlight ? (
      <CheckCircle2 className="h-4 w-4 mx-auto text-primary" />
    ) : (
      <Check className="h-4 w-4 mx-auto text-emerald-500" />
    );
  }
  if (value === false) {
    return <X className="h-4 w-4 mx-auto text-muted-foreground/30" />;
  }
  return <Minus className="h-4 w-4 mx-auto text-amber-500" />;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default async function MarketingHomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const [plans, packs, rollover] = await Promise.all([
    fetchPlans(),
    fetchPacks(),
    fetchRollover(),
  ]);

  return (
    <div className="overflow-x-hidden">
      <DeletedAccountToast />

      {/* AuthModalOpener: reads ?auth=signup|login from URL */}
      <Suspense fallback={null}>
        <AuthModalOpener />
      </Suspense>

      {/* ══ SECTION 1 — HERO ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden
        px-4 pt-24 pb-20 md:pt-32 md:pb-28"
      >
        {/* Background: radial purple glow */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.15), transparent)",
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
          <div
            className="grid grid-cols-1 lg:grid-cols-2
            gap-12 lg:gap-16 items-center"
          >
            {/* Left: text content */}
            <HeroCTA />

            {/* Right: visual mockup */}
            <div
              className="rounded-2xl border border-border
              bg-card shadow-xl p-5 lg:ml-auto w-full
              max-w-md"
            >
              {/* Header row */}
              <div
                className="flex items-center
                justify-between mb-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full
                    bg-primary"
                  />
                  <span
                    className="text-sm font-medium
                    text-foreground"
                  >
                    SetuLix AI
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5
                  text-xs text-green-600
                  dark:text-green-400"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full
                    bg-green-500 animate-pulse"
                  />
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
                    <Icon
                      className="h-3.5 w-3.5
                      text-primary shrink-0"
                    />
                    <span
                      className="text-xs font-medium
                      text-foreground"
                    >
                      {name}
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5
                    rounded-full bg-primary/10
                    text-primary font-medium shrink-0"
                  >
                    {stat}
                  </span>
                </div>
              ))}

              {/* Footer row */}
              <div
                className="flex items-center gap-2
                mt-4 pt-3 border-t border-border"
              >
                <CheckCircle
                  className="h-3.5 w-3.5
                  text-green-500 shrink-0"
                />
                <p className="text-xs text-muted-foreground">
                  Credits deducted only after successful output
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2 — STATS BAR ════════════════════════════════════════════ */}
      <section className="border-y border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                  {value}
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-widest
            text-primary bg-primary/10 rounded-full px-3 py-1 mb-3"
          >
            5 Profession Kits
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Built for every Indian professional
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Pick your kit. Get a workspace with the tools you actually need —
            not 27 tabs of confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {WHO_CARDS.map(
            ({ kit, Icon, title, desc, outcome, tools, color }) => {
              const c = KIT_COLOR_MAP[color];
              return (
                <Link
                  key={kit}
                  href={`/kits/${kit}`}
                  className="group rounded-2xl border border-border bg-card p-5 h-full
                  hover:border-primary/30 hover:shadow-md hover:shadow-primary/5
                  transition-all duration-200 flex flex-col gap-4"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg} transition-colors`}
                  >
                    <Icon className={`h-5 w-5 ${c.iconText}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium
                  px-2.5 py-1 rounded-full border self-start
                  ${c.chipBg} ${c.chipText} ${c.chipBorder}`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {outcome}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {tools.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="
    inline-flex items-center
    rounded-full
    border border-border/60
    bg-background/80
    px-3 py-1
    text-xs font-medium
    text-muted-foreground
    backdrop-blur-sm
    transition-colors duration-200
    group-hover:border-primary/20
    group-hover:text-foreground
  "
                      >
                        {t}
                      </span>
                    ))}
                    {tools.length > 3 && (
                      <span
                        className="
    inline-flex items-center
    rounded-full
    border border-primary/10
    bg-primary/5
    px-3 py-1
    text-xs font-semibold
    text-primary
  "
                      >
                        +{tools.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              );
            },
          )}
        </div>
      </section>

      {/* ══ SECTION 4 — FEATURES (Issue 5 redesign) ══════════════════════════ */}
      <section
        id="features"
        className="bg-muted/10 border-t border-b border-border py-20 md:py-28"
      >
        <div className="max-w-5xl mx-auto px-4">
          <SectionHeading
            eyebrow="Why it works"
            title="One workspace. Every professional need."
            subtitle="Stop switching between tools. SetuLix gives you everything in one place — personalised to how you work."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {/* Card 1 — Personalised Kit */}
            <div
              className="bg-card border border-border rounded-2xl p-8
              hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
              transition-all duration-300"
            >
              <div
                className="w-14 h-14 rounded-2xl bg-primary/10
                flex items-center justify-center mb-6"
              >
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-3">
                Your kit. Your tools.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Answer 4 questions during onboarding. SetuLix builds a
                personalised workspace with only the tools you need — no
                clutter, no noise.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  "Creator Kit",
                  "SME Kit",
                  "HR Kit",
                  "Legal Kit",
                  "Marketing Kit",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="
  inline-flex items-center
  rounded-full
  border border-border/60
  bg-muted/5
  px-3 py-1.5
  text-xs font-medium
  text-muted-foreground
  backdrop-blur-sm
  transition-colors duration-200
  hover:border-primary/20
  hover:text-foreground
"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2 — AI Models (highlighted center) */}
            <div
              className="bg-card border border-border rounded-2xl p-8
              ring-1 ring-primary/30 shadow-lg shadow-primary/10
              hover:shadow-xl hover:shadow-primary/15
              transition-all duration-300"
            >
              <span
                className="inline-flex bg-primary text-primary-foreground
                text-[10px] font-bold px-2.5 py-1 rounded-full mb-6"
              >
                Most powerful
              </span>
              <div
                className="w-14 h-14 rounded-2xl bg-primary/10
                flex items-center justify-center mb-6"
              >
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-3">
                Best AI for every job.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Legal docs use Claude Sonnet. SEO audits use GPT-4o. Captions
                use Gemini Flash. You always get the right model — not the
                cheapest one.
              </p>
              <div className="flex gap-3 mt-4 flex-wrap">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  Claude Sonnet
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  GPT-4o
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Gemini Flash
                </span>
              </div>
            </div>

            {/* Card 3 — Credits */}
            <div
              className="bg-card border border-border rounded-2xl p-8
              hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
              transition-all duration-300"
            >
              <div
                className="w-14 h-14 rounded-2xl bg-primary/10
                flex items-center justify-center mb-6"
              >
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-3">
                Pay for what you use.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No monthly waste. Credits never expire on packs. Free tools stay
                free forever. Upgrade your plan only when your volume demands
                it.
              </p>
              <div className="mt-4 bg-muted/5 rounded-xl p-3 space-y-0">
                <div className="flex items-center justify-between py-1.5 border-b border-border text-xs">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-500" />
                    <span className="text-foreground">GST Invoice</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Free
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-foreground">Blog post</span>
                  </div>
                  <span className="text-muted-foreground">3 credits</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-primary" />
                    <span className="text-foreground">Legal Notice</span>
                  </div>
                  <span className="text-muted-foreground">8 credits</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4B — PERSONA JOURNEYS ════════════════════════════════════ */}
      <div className="border-t border-border" />
      <PersonaJourney />
      <div className="border-t border-border" />

      {/* ══ SECTION 6 — HOW IT WORKS (Issue 9 upgrade) ══════════════════════ */}
      <section
        className="relative overflow-hidden py-20 md:py-28
        border-t border-b border-border bg-background"
      >
        {/* Decorative blur circle */}
        <div
          className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />

        <div className="max-w-6xl mx-auto px-4 relative">
          {/* Heading */}
          <div className="text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3">
              Simple by design
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              From signup to output in under 3 minutes.
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              No learning curve. No complex setup. Just pick a tool and go.
            </p>
          </div>

          {/* 4-step grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {[
              {
                num: "01",
                Icon: UserPlus,
                title: "Create your free account",
                body: "Sign up with Google or email in 30 seconds. No credit card, no commitments. You get",
                highlight: "10 free credits",
                tail: "on day one.",
                time: "30 sec",
              },
              {
                num: "02",
                Icon: LayoutGrid,
                title: "Choose your kit",
                body: "Tell us what you do — creator, business owner, HR, or legal. SetuLix builds a",
                highlight: "personalised workspace",
                tail: "for you instantly.",
                time: "1 min",
              },
              {
                num: "03",
                Icon: Wand2,
                title: "Run any AI tool",
                body: "Pick a tool, fill in a few details, hit Generate. Powered by",
                highlight: "Claude, GPT-4o, and Gemini",
                tail: "— the best model for each task.",
                time: "< 1 min",
              },
              {
                num: "04",
                Icon: Download,
                title: "Download your output",
                body: "Copy the output, download as PDF, or save to your history. PRO users get",
                highlight: "branded PDFs",
                tail: "with their logo and signature.",
                time: "instant",
              },
            ].map(
              ({ num, Icon, title, body, highlight, tail, time }, idx, arr) => (
                <div key={num} className="relative">
                  {/* Connector arrow (desktop) */}
                  {idx < arr.length - 1 && (
                    <div
                      className="hidden md:flex items-center justify-center
                    absolute -right-3 top-1/3 z-10"
                    >
                      <ChevronRight className="h-5 w-5 text-primary/30" />
                    </div>
                  )}

                  {/* Card with gradient top border */}
                  <div
                    className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6
                  flex flex-col relative overflow-hidden h-full
                  before:absolute before:inset-x-0 before:top-0 before:h-px
                  before:bg-gradient-to-r before:from-transparent before:via-primary/40 before:to-transparent"
                  >
                    <span
                      className="absolute top-4 right-4 text-5xl font-black
                    text-primary/6 leading-none select-none"
                    >
                      {num}
                    </span>
                    <div
                      className="w-11 h-11 rounded-xl bg-primary/10
                    flex items-center justify-center shrink-0"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-4">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {body}{" "}
                      <span className="text-foreground font-medium">
                        {highlight}
                      </span>{" "}
                      {tail}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium
                    text-muted-foreground mt-4 bg-muted/10 px-2 py-0.5 rounded-full self-start"
                    >
                      <Clock className="h-3 w-3" />
                      {time}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Section CTA */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Ready to save 10 hours this week?
            </p>
            <a
              href="/?auth=signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                bg-primary text-primary-foreground text-sm font-semibold
                hover:opacity-90 transition-opacity"
            >
              Start free, no card needed
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ══ SECTION 7 — COMPARISON TABLE (Issue 10 redesign) ════════════════ */}
      <section className="px-4 py-20 bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            eyebrow="Why SetuLix"
            title="Built for India. Not adapted for it."
            subtitle="Other tools are built for the US market and bolted on for India. SetuLix starts with Indian professionals in mind."
          />

          <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  {/* Feature label column */}
                  <th
                    className="sticky left-0 text-left px-5 py-4 text-xs font-semibold
                    text-muted-foreground uppercase tracking-wider
                    bg-muted/10 backdrop-blur border-b border-r border-border
                    w-[32%] rounded-tl-2xl"
                  >
                    Feature
                  </th>
                  {/* SetuLix — highlighted */}
                  <th className="px-5 py-4 text-center bg-primary border-b border-primary/60 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-extrabold text-primary-foreground tracking-tight">
                        SetuLix
                      </span>
                      <span
                        className="inline-block text-[9px] font-bold uppercase tracking-widest
                        bg-white/20 text-primary-foreground rounded-full px-2 py-0.5"
                      >
                        ✦ India-first
                      </span>
                    </div>
                  </th>
                  {/* Competitor columns */}
                  {COMPETITORS.slice(1).map((name, i) => (
                    <th
                      key={name}
                      className={`px-4 py-4 text-xs font-semibold text-muted-foreground
                        text-center bg-muted/10 border-b border-border min-w-[100px]
                        ${i === COMPETITORS.length - 2 ? "rounded-tr-2xl" : ""}`}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(({ feature, values }, rowIdx) => {
                  const isLast = rowIdx === COMPARISON.length - 1;
                  return (
                    <tr
                      key={feature}
                      className={rowIdx % 2 === 0 ? "bg-card" : "bg-muted/1"}
                    >
                      {/* Feature label */}
                      <td
                        className={`sticky left-0 px-5 py-3.5 text-sm font-medium text-foreground
                        bg-inherit border-r border-border/60
                        ${isLast ? "rounded-bl-2xl" : ""}`}
                      >
                        {feature}
                      </td>
                      {/* SetuLix cell — always true */}
                      <td className="px-4 py-3.5 text-center bg-primary/8">
                        <div className="flex justify-center">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                      </td>
                      {/* Competitor cells */}
                      {values.slice(1).map((val, colIdx) => (
                        <td
                          key={colIdx}
                          className={`px-4 py-3.5 text-center
                            ${isLast && colIdx === values.length - 2 ? "rounded-br-2xl" : ""}`}
                        >
                          <div className="flex justify-center">
                            {val === true && (
                              <Check className="h-5 w-5 text-emerald-500" />
                            )}
                            {val === false && (
                              <X className="h-5 w-5 text-muted-foreground/30" />
                            )}
                            {val === "partial" && (
                              <Minus className="h-5 w-5 text-amber-500" />
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Below table */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Each tool listed serves a different primary purpose. SetuLix is
              built specifically for Indian professionals who need billing,
              legal, HR, and content tools in one place.
            </p>
            <a
              href="/?auth=signup"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl
                bg-primary text-primary-foreground text-sm font-semibold
                hover:opacity-90 transition-opacity"
            >
              Start free — no card needed
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ══ SECTION 8 — PRICING (Issue 2 — DB-driven via PricingPage) ════════ */}
      <section id="pricing">
        <PricingPage plans={plans} packs={packs} rollover={rollover} />
      </section>

      {/* ══ SECTION 9 — TESTIMONIALS (Issue 11 carousel) ════════════════════ */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <SectionHeading
          eyebrow="Testimonials"
          title="Real people. Real results."
          subtitle="What Indian professionals say about SetuLix."
        />
        <TestimonialsCarousel testimonials={TESTIMONIALS} />
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

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-card/50 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="18"
                    height="8"
                    rx="3"
                    fill="#7c3aed"
                  />
                  <rect
                    x="10"
                    y="12"
                    width="18"
                    height="8"
                    rx="3"
                    fill="#7c3aed"
                    opacity="0.7"
                  />
                  <rect
                    x="4"
                    y="20"
                    width="18"
                    height="8"
                    rx="3"
                    fill="#7c3aed"
                  />
                </svg>
                <span className="font-bold text-foreground">
                  Setu<span className="text-primary">Lix</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI workspace for every Indian professional. 27 tools. 5 kits.
                One platform.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Product
              </h4>
              <ul className="space-y-2">
                {[
                  ["Tools", "/tools"],
                  ["Pricing", "/pricing"],
                  ["About", "/about"],
                ].map(([l, h]) => (
                  <li key={h}>
                    <Link
                      href={h}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Kits
              </h4>
              <ul className="space-y-2">
                {[
                  ["Creator", "/kits/creator"],
                  ["SME", "/kits/sme"],
                  ["HR", "/kits/hr"],
                  ["Legal", "/kits/legal"],
                  ["Marketing", "/kits/marketing"],
                ].map(([l, h]) => (
                  <li key={h}>
                    <Link
                      href={h}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Company
              </h4>
              <ul className="space-y-2">
                {[
                  ["About", "/about"],
                  ["Contact", "mailto:hello@setulix.com"],
                ].map(([l, h]) => (
                  <li key={h}>
                    <Link
                      href={h}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 SetuLabsAI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Designed &amp; built by SetuLabsAI · Founder &amp; CEO: Deepak
              Rathor · Made in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
