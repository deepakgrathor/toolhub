import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getToolBySlug } from "@/lib/tool-registry";
import { LoginBanner } from "@/components/tools/LoginBanner";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getToolBySlug(params.slug);
  if (!tool) return { title: "Tool Not Found — Toolspire" };
  return {
    title: `${tool.name} — Toolspire`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: Props) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) notFound();

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{tool.name}</span>
      </div>

      {/* 2-column layout */}
      <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
        {/* Left panel — 45% */}
        <div className="lg:w-[45%] lg:border-r border-border p-6 space-y-5">
          {/* Tool header */}
          <div className="flex items-start gap-4">
            <span className="text-4xl">{tool.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{tool.name}</h1>
                {tool.isFree ? (
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                    FREE
                  </span>
                ) : (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    {tool.config.creditCost} credits
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {tool.description}
              </p>
            </div>
          </div>

          {/* Login banner (client component checks auth) */}
          <LoginBanner />

          {/* Tool form placeholder */}
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-2xl mb-2">🛠️</p>
            <p className="text-sm font-medium text-foreground">Tool UI coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              This tool is under active development
            </p>
          </div>
        </div>

        {/* Right panel — 55% */}
        <div className="lg:w-[55%] p-6">
          <div className="rounded-xl border border-dashed border-border bg-surface/50 h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
            <p className="text-3xl mb-3">✨</p>
            <p className="text-sm font-medium text-foreground">Output will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run the tool to see your results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
