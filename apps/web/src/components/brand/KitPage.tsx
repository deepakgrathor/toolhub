import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { getToolIcon } from "@/lib/tool-icons";
import { Footer } from "./Footer";

interface Tool {
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  isFree: boolean;
}

interface Step {
  title: string;
  description: string;
}

interface UseCase {
  title: string;
  description: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface KitPageProps {
  kitId: string;
  name: string;
  tagline: string;
  Icon: LucideIcon;
  tools: Tool[];
  steps: Step[];
  useCases: UseCase[];
  faqs: FAQ[];
}

export function KitPage({ name, tagline, Icon, tools, steps, useCases, faqs }: KitPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border py-16 px-6 text-center">
        <div className="flex justify-center mb-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">{name}</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">{tagline}</p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Try Free
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {/* Tools Grid */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-2 border-l-2 border-primary pl-3">Tools in this Kit</h2>
          <p className="text-sm text-muted-foreground mb-6 pl-5">{tools.length} tools available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const ToolIcon = getToolIcon(tool.slug);
              return (
                <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                  <div className="tool-card group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all duration-150">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <ToolIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate">{tool.name}</span>
                        {tool.isFree ? (
                          <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">FREE</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{tool.creditCost}cr</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How it Works */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-8 border-l-2 border-primary pl-3">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 border-l-2 border-primary pl-3">Use Cases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCases.map((uc, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-1">{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 border-l-2 border-primary pl-3">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-foreground select-none">
                  {faq.q}
                  <span className="ml-4 text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Start Using These Tools Today</h2>
          <p className="text-sm text-muted-foreground mb-6">Free to start, no credit card required.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
              Try Free →
            </Link>
            <Link href="/pricing" className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
              Buy Credits →
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
