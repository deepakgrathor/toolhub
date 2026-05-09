import { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, History } from "lucide-react";
import { getAllTools, ToolWithConfig } from "@/lib/tool-registry";
import { ToolCard } from "@/components/tools/ToolCard";
import { CreditOverview } from "@/components/dashboard/CreditOverview";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { ReferralCard } from "@/components/dashboard/ReferralCard";

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

      {/* Credit overview + Referral card */}
      <div className="flex flex-col gap-6 md:grid md:grid-cols-3 mb-8">
        <div className="lg:col-span-1">
          <CreditOverview />
        </div>
        <div className="lg:col-span-2">
          <ReferralCard />
        </div>
      </div>

      {/* Transaction history */}
      <div className="mb-2">
        <TransactionHistory />
      </div>

      {/* Link to full output history */}
      <div className="mb-10 flex justify-end">
        <Link
          href="/dashboard/history"
          className="flex items-center gap-2 text-sm text-[#7c3aed] hover:underline"
        >
          <History className="h-4 w-4" />
          View Full History →
        </Link>
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
