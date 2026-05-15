import Link from 'next/link'
import { ChevronRight, ArrowRight, Users } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { TOOLS } from '@/data/tools-data'
import { getToolIcon } from '@/lib/tool-icons'
import type { ToolSeoData } from '@/data/tool-seo'
import { ToolJsonLd } from '@/components/seo/ToolJsonLd'

interface Props {
  seoData: ToolSeoData
}

export function ToolPublicPage({ seoData }: Props) {
  const relatedTools = seoData.relatedSlugs
    .map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter(Boolean) as (typeof TOOLS)[number][]

  return (
    <>
      <ToolJsonLd seoData={seoData} />

      <div className="min-h-screen bg-background">
        {/* ── Breadcrumb ─────────────────────────────────────────────── */}
        <div className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                href="/tools"
                className="hover:text-foreground transition-colors"
              >
                Tools
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                href={`/kits/${seoData.kitSlug}`}
                className="hover:text-foreground transition-colors"
              >
                {seoData.kitName}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground">{seoData.h1}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-20">
          {/* ── Hero ───────────────────────────────────────────────────── */}
          <section className="text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {seoData.h1}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {seoData.description}
            </p>
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/?auth=signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Try {seoData.slug.replace(/-/g, ' ')} free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-sm text-muted-foreground">
                No credit card required &middot; 10 free credits on signup
              </p>
            </div>
          </section>

          {/* ── How it works ───────────────────────────────────────────── */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground text-center">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seoData.howItWorks.map((step) => (
                <div
                  key={step.step}
                  className="bg-card border border-border rounded-xl p-6 space-y-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Use cases ──────────────────────────────────────────────── */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground text-center">
              Who uses this tool
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seoData.useCases.map((uc, i) => (
                <div
                  key={i}
                  className="bg-muted/30 rounded-xl p-6 space-y-3"
                >
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {uc.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ────────────────────────────────────────────────────── */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground text-center">
              Frequently asked questions
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {seoData.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-foreground font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* ── Related tools ──────────────────────────────────────────── */}
          {relatedTools.length > 0 && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-foreground text-center">
                Related tools in {seoData.kitName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {relatedTools.map((tool) => {
                  const Icon = getToolIcon(tool.slug)
                  return (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="bg-card border border-border rounded-xl p-5 flex items-start gap-3 hover:border-primary/50 transition-colors group"
                    >
                      <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {tool.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Try free &rarr;
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Bottom CTA ─────────────────────────────────────────────── */}
          <section className="text-center bg-card border border-border rounded-2xl p-10 space-y-5">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to try {seoData.h1.split('—')[0].trim()}?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Join thousands of Indian professionals and businesses using
              SetuLix to work smarter.
            </p>
            <Link
              href="/?auth=signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
