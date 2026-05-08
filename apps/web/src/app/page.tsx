import Link from "next/link";
import { getAllTools, getKitList } from "@/lib/tool-registry";
import { ToolCard } from "@/components/tools/ToolCard";

const KIT_CONFIG: Record<string, { emoji: string; label: string }> = {
  creator: { emoji: "🎨", label: "Creator Kit" },
  sme: { emoji: "🏪", label: "SME Kit" },
  hr: { emoji: "👥", label: "HR Kit" },
  "ca-legal": { emoji: "⚖️", label: "CA / Legal Kit" },
  marketing: { emoji: "📣", label: "Marketing Kit" },
};

const POPULAR_SLUGS = [
  "blog-generator",
  "yt-script",
  "gst-invoice",
  "resume-screener",
  "legal-notice",
  "thumbnail-ai",
];

const STATS = [
  { value: "30+", label: "Tools" },
  { value: "5", label: "Kits" },
  { value: "₹1.33", label: "Starting / use" },
  { value: "Free", label: "Forever Plan" },
];

export default async function HomePage() {
  let allTools: Awaited<ReturnType<typeof getAllTools>> = [];
  let kitList: Awaited<ReturnType<typeof getKitList>> = [];
  try {
    [allTools, kitList] = await Promise.all([getAllTools(), getKitList()]);
  } catch {
    // DB not available — show static shell
  }

  const popularTools = POPULAR_SLUGS.flatMap((slug) => {
    const t = allTools.find((tool) => tool.slug === slug);
    return t ? [t] : [];
  });

  const kitCards = Object.entries(KIT_CONFIG).map(([kit, { emoji, label }]) => {
    const count = kitList.find((k) => k.kit === kit)?.toolCount ?? 0;
    const examples = allTools.filter((t) => t.kits.includes(kit)).slice(0, 3);
    return { kit, emoji, label, count, examples };
  });

  return (
    <div className="overflow-auto">
      {/* Hero */}
      <section className="px-6 py-16 md:py-24 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent mb-6">
          <span>⚡</span> Made for India
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight mb-4">
          One Platform.{" "}
          <span className="text-accent">Every Tool</span> You Need.
        </h1>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          AI-powered tools for creators, businesses &amp; professionals.
          <br className="hidden md:block" /> Pay only for what you use.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/tools"
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Explore Tools
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
          >
            See Pricing
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          30+ tools • No subscription needed • Made for India
        </p>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-4xl px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Kit showcase */}
      <section className="px-6 py-14 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Built for Every Professional
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Five purpose-built kits, each packed with AI tools for your workflow
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {kitCards.map(({ kit, emoji, label, count, examples }) => (
            <Link key={kit} href={`/tools?kit=${kit}`}>
              <div className="rounded-xl border border-border bg-surface p-4 hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 h-full">
                <div className="text-3xl mb-3">{emoji}</div>
                <div className="font-semibold text-sm text-foreground mb-1">{label}</div>
                <div className="text-xs text-muted-foreground mb-3">{count} tools</div>
                <ul className="space-y-0.5">
                  {examples.map((t) => (
                    <li key={t.slug} className="text-xs text-muted-foreground truncate">
                      • {t.name}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular tools */}
      <section className="px-6 py-10 pb-16 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Most Used Tools</h2>
          <Link
            href="/tools"
            className="text-sm text-accent hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
