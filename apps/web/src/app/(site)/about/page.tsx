import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Footer } from "@/components/brand/Footer";
import { BRAND } from "@toolhub/shared";

export const metadata: Metadata = {
  title: `About ${BRAND.name} | ${BRAND.company}`,
  description: `${BRAND.name} is an AI-powered multi-tool SaaS platform built for Indian businesses. 27 tools across 5 kits.`,
};

const TECH_STACK = [
  "Next.js 14", "MongoDB", "OpenAI", "Anthropic Claude",
  "Google Gemini", "Razorpay", "Vercel", "Upstash Redis",
];

const KITS = [
  { name: "Creator Kit", tools: "Blog, YT Script, Thumbnail AI, Title, Hook, Caption" },
  { name: "SME Kit", tools: "GST Invoice, Expense Tracker, Quotation, QR Code, WhatsApp Bulk" },
  { name: "HR Kit", tools: "JD Generator, Resume Screener, Appraisal Draft, Policy Generator" },
  { name: "CA/Legal Kit", tools: "Legal Notice, NDA Generator, Legal Disclaimer, GST Calculator" },
  { name: "Marketing Kit", tools: "Ad Copy, Caption Generator, Email Subject, LinkedIn Bio, SEO Auditor" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border py-16 px-6 text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showSubtext href="/" />
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {BRAND.tagline}
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Try {BRAND.name} Free
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Buy Credits
          </Link>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* About SetuLix */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">About {BRAND.name}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {BRAND.name} is an AI-powered multi-tool SaaS platform built for Indian businesses.
            We offer 27 tools across 5 kits — Creator, SME, HR, CA/Legal, and Marketing.
            Free tools for everyone, with AI-powered tools available on a simple credit system.
            No subscriptions, no complexity — just powerful tools when you need them.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KITS.map((kit) => (
              <div key={kit.name} className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">{kit.name}</h3>
                <p className="text-xs text-muted-foreground">{kit.tools}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About SetuLabsAI */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">About {BRAND.company}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {BRAND.name} is a flagship product of {BRAND.company} — an Indian AI products company
            building AI-first tools for the next generation of Indian entrepreneurs and businesses.
            We believe every Indian business, regardless of size, deserves access to world-class AI tools.
          </p>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Team</h2>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">DR</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{BRAND.founder}</p>
              <p className="text-sm text-muted-foreground">{BRAND.founderTitle}, {BRAND.company}</p>
            </div>
          </div>
        </section>

        {/* Built With */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Built With</h2>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Join thousands of Indian businesses using {BRAND.name}.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Try Free →
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Buy Credits →
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
