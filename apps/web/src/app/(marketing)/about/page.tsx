import type { Metadata } from "next";
import Link from "next/link";
import {
  Globe2, IndianRupee, Users, CheckCircle2, Linkedin,
} from "lucide-react";
import AboutCTA from "./AboutCTA";

export const metadata: Metadata = {
  title: "About SetuLix | SetuLabsAI",
  description:
    "SetuLix is an AI workspace built from the ground up for Indian professionals. 27 tools, 5 kits, ₹0 to start.",
};

const PROBLEMS = [
  {
    Icon: Globe2,
    title: "Global tools, Indian problems",
    body: "ChatGPT doesn't know GST. Jasper doesn't write legal notices. Canva doesn't do salary slips. Every Indian professional was stitching 5 different tools together just to run their week.",
  },
  {
    Icon: IndianRupee,
    title: "Pricing that punished you",
    body: "Most AI tools charge in USD. For an Indian freelancer or SME, $49/month is not a coffee — it's a real cost. We built SetuLix around Indian purchasing power from day one.",
  },
  {
    Icon: Users,
    title: "No kit, no context",
    body: "Generic AI gives generic output. A blogger needs different tools than a lawyer. We built profession-specific kits so your workspace starts ready — not blank.",
  },
];

const STATS = [
  { value: "27+", label: "AI Tools" },
  { value: "500+", label: "Professionals" },
  { value: "5", label: "Industry Kits" },
  { value: "₹0", label: "To start" },
];

const PRINCIPLES = [
  {
    title: "India-first, always",
    body: "Every tool, every pricing decision, every feature is designed for Indian professionals first. GST, UPI, Indian legal formats — native.",
  },
  {
    title: "Outcome over features",
    body: "We don't build tools because we can. We build them because they solve a real problem faster than doing it manually.",
  },
  {
    title: "Simple pricing, honest product",
    body: "Pay-per-use credits mean you never waste money. No lock-in. No hidden overages. No annual-only traps.",
  },
  {
    title: "Privacy by default",
    body: "Your outputs are yours. We don't train on your data. We don't sell your usage patterns. Full stop.",
  },
  {
    title: "Best model for the job",
    body: "Claude Sonnet for legal docs. GPT-4o for SEO. Gemini Flash for speed. We pick the right AI for each task — not the cheapest one.",
  },
  {
    title: "Built to grow with you",
    body: "Start free. Add credits when you need. Upgrade when it makes sense. SetuLix scales with your work, not against it.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 text-center">
        {/* Radial glow */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.15), transparent)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border,#e5e7eb) 1px, transparent 1px), linear-gradient(90deg, var(--color-border,#e5e7eb) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Our Story
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            We built SetuLix because we got tired of the workarounds.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Indian professionals deserve tools built for them — not US products with ₹ signs bolted on.
            SetuLix is a workspace OS built from the ground up for Indian creators, businesses, HR teams, and legal pros.
          </p>
        </div>
      </section>

      {/* ── Section 2: Problem cards ──────────────────────────────────────── */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10
                flex items-center justify-center mb-5">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-3">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Founder block ──────────────────────────────────────── */}
      <section className="px-4 py-20 bg-muted/30 border-t border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground
              flex items-center justify-center text-2xl font-bold shrink-0">
              DR
            </div>
            {/* Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-lg font-bold text-foreground">Deepak Rathor</p>
                <a
                  href="https://www.linkedin.com/in/deepakgrathor/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Founder &amp; CEO, SetuLabsAI
              </p>
              <blockquote className="border-l-4 border-primary pl-4">
                <p className="text-sm text-foreground leading-relaxed italic">
                  &ldquo;I kept switching between 6 different tools every day just to write
                  content, send invoices, and handle basic HR tasks. Every tool had
                  a different login, a different pricing page, and none of them
                  understood India. SetuLix is the workspace I wanted to exist.&rdquo;
                </p>
              </blockquote>
              <p className="text-xs text-muted-foreground mt-4">
                Based in Indore · Building for 1.4 billion people
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Stats row ──────────────────────────────────────────── */}
      <section className="border-t border-b border-border bg-muted/30 py-12">
        <div className="max-w-5xl mx-auto px-4">
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

      {/* ── Section 5: Principles ────────────────────────────────────────── */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Our principles
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRINCIPLES.map(({ title, body }) => (
            <div key={title} className="flex gap-4">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: CTA ───────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto bg-primary text-primary-foreground
          rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Come build with us.
          </h2>
          <p className="text-primary-foreground/80 text-base mb-8">
            27 tools. One workspace. Free to start.
          </p>
          <AboutCTA />
        </div>
      </section>

    </div>
  );
}
