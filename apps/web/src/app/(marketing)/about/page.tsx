import type { Metadata } from "next";
import { BRAND } from "@toolhub/shared";
import AboutCTA from "./AboutCTA";

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
        <h1 className="text-4xl font-bold text-foreground mb-3">
          About <span className="text-primary">SetuLix</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          {BRAND.tagline}
        </p>
        <AboutCTA />
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
      </div>
    </div>
  );
}
