import { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { getAllTools, ToolWithConfig } from "@/lib/tool-registry";
import { ToolCard } from "@/components/tools/ToolCard";
import { CreditOverview } from "@/components/dashboard/CreditOverview";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";

export const metadata: Metadata = {
  title: "Dashboard — Toolspire",
  description: "Manage your credits and view transaction history.",
};

export const dynamic = "force-dynamic";

const POPULAR_SLUGS = [
  "blog-generator",
  "yt-script",
  "gst-invoice",
  "resume-screener",
  "legal-notice",
  "thumbnail-ai",
];

export default async function DashboardPage() {
  let popularTools: ToolWithConfig[] = [];
  try {
    const all = await getAllTools();
    const bySlug = new Map(all.map((t) => [t.slug, t]));
    popularTools = POPULAR_SLUGS
      .map((s) => bySlug.get(s))
      .filter((t): t is ToolWithConfig => t !== undefined);
    if (popularTools.length === 0) popularTools = all.slice(0, 6);
  } catch {
    // DB unavailable — show empty
  }

  return (
    <div className="min-h-full px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Credit overview card — full width on mobile, 1/3 on lg */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-1">
          <CreditOverview />
        </div>
      </div>

      {/* Transaction history */}
      <div className="mb-10">
        <TransactionHistory />
      </div>

      {/* Popular tools */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="h-5 w-5 text-[#7c3aed]" />
          <h2 className="text-lg font-semibold text-foreground">Popular Tools</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {popularTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
