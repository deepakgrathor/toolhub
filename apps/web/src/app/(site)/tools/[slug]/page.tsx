import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, Wrench, Sparkles } from "lucide-react";
import { getToolBySlug } from "@/lib/tool-registry";
import { LoginBanner } from "@/components/tools/LoginBanner";
import { getToolIcon } from "@/lib/tool-icons";
import { ToolLoadingSkeleton } from "@/components/tools/ToolLoadingSkeleton";

// ── Dynamic tool component map ────────────────────────────────────────────────
// Add new tools here as they are built. Each entry is code-split automatically.

const toolComponents: Record<string, React.ComponentType<{ creditCost?: number }>> = {
  "blog-generator": dynamic(
    () => import("@/tools/blog-generator/BlogGeneratorTool"),
    { loading: () => <ToolLoadingSkeleton /> }
  ),
};

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const Icon = getToolIcon(tool.slug);
  const ToolComponent = toolComponents[params.slug];

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground transition-colors">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{tool.name}</span>
      </div>

      {/* Render functional tool component if available, else placeholder */}
      {ToolComponent ? (
        <ToolComponent creditCost={tool.config.creditCost} />
      ) : (
        <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
          {/* Left panel — 45% */}
          <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5">
            {/* Tool header */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {tool.name}
                  </h1>
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

            {/* Login banner */}
            <LoginBanner />

            {/* Tool form placeholder */}
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Tool UI coming soon
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This tool is under active development
              </p>
            </div>
          </div>

          {/* Right panel — 55% */}
          <div className="lg:w-[55%] p-4 md:p-6">
            <div className="rounded-xl border border-dashed border-border bg-surface/50 h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Output will appear here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Run the tool to see your results
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
