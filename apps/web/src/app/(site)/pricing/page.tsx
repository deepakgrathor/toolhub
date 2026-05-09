import { Metadata } from "next";
import { connectDB, CreditPack, ICreditPack } from "@toolhub/db";
import { cn } from "@/lib/utils";
import {
  Video,
  FileText,
  FileSearch,
  Receipt,
  Briefcase,
  Globe,
  Gavel,
  Lock,
  Image,
  BarChart2,
  Wallet,
  Calculator,
  ChevronDown,
} from "lucide-react";
import { BuyCreditsButton } from "@/components/credits/BuyCreditsButton";

export const metadata: Metadata = {
  title: "Pricing — SetuLix",
  description:
    "Buy credits once, use anytime. No subscriptions. Credits never expire.",
};

export const dynamic = "force-dynamic";

async function getPacks(): Promise<ICreditPack[]> {
  try {
    await connectDB();
    return CreditPack.find({ isActive: true }).sort({ sortOrder: 1 }).lean() as unknown as Promise<ICreditPack[]>;
  } catch {
    return [];
  }
}

const TOOL_PRICING = [
  { name: "Hook Writer", kit: "Creator", credits: 0 },
  { name: "Caption Generator", kit: "Creator", credits: 0 },
  { name: "GST Invoice", kit: "SME", credits: 0 },
  { name: "Expense Tracker", kit: "SME", credits: 0 },
  { name: "Quotation Generator", kit: "SME", credits: 0 },
  { name: "QR Generator", kit: "SME", credits: 0 },
  { name: "Salary Slip", kit: "HR", credits: 0 },
  { name: "Offer Letter", kit: "HR", credits: 0 },
  { name: "GST Calculator", kit: "CA/Legal", credits: 0 },
  { name: "TDS Sheet", kit: "CA/Legal", credits: 0 },
  { name: "Title Generator", kit: "Creator", credits: 1 },
  { name: "Email Subject", kit: "Marketing", credits: 1 },
  { name: "WhatsApp Bulk", kit: "Marketing", credits: 1 },
  { name: "Blog Generator", kit: "Creator", credits: 3 },
  { name: "Resume Screener", kit: "HR", credits: 3 },
  { name: "JD Generator", kit: "HR", credits: 3 },
  { name: "Appraisal Draft", kit: "HR", credits: 3 },
  { name: "Policy Generator", kit: "HR", credits: 3 },
  { name: "LinkedIn Bio", kit: "Marketing", credits: 3 },
  { name: "Ad Copy", kit: "Marketing", credits: 3 },
  { name: "Legal Disclaimer", kit: "CA/Legal", credits: 3 },
  { name: "YT Script Writer", kit: "Creator", credits: 4 },
  { name: "Thumbnail AI", kit: "Creator", credits: 7 },
  { name: "SEO Auditor", kit: "Marketing", credits: 8 },
  { name: "Website Generator", kit: "SME", credits: 10 },
  { name: "Legal Notice", kit: "CA/Legal", credits: 12 },
  { name: "NDA Generator", kit: "CA/Legal", credits: 12 },
];

const FEATURED_EXAMPLES = [
  { Icon: Video, name: "YT Script Writer" },
  { Icon: FileText, name: "Blog Generator" },
  { Icon: FileSearch, name: "Resume Screener" },
];

const PACK_EXAMPLES: Record<string, { Icon: React.ElementType; name: string }[]> = {
  Starter: [
    { Icon: Receipt, name: "GST Invoice" },
    { Icon: Wallet, name: "Expense Tracker" },
    { Icon: Calculator, name: "GST Calculator" },
  ],
  Popular: [
    { Icon: Video, name: "YT Script Writer" },
    { Icon: FileText, name: "Blog Generator" },
    { Icon: FileSearch, name: "Resume Screener" },
  ],
  Pro: [
    { Icon: Image, name: "Thumbnail AI" },
    { Icon: BarChart2, name: "SEO Auditor" },
    { Icon: Globe, name: "Website Generator" },
  ],
  Business: [
    { Icon: Gavel, name: "Legal Notice" },
    { Icon: Lock, name: "NDA Generator" },
    { Icon: Briefcase, name: "JD Generator" },
  ],
  Enterprise: [
    { Icon: Globe, name: "Website Generator" },
    { Icon: Image, name: "Thumbnail AI" },
    { Icon: Gavel, name: "Legal Notice" },
  ],
};

const FAQS = [
  {
    q: "Do credits expire?",
    a: "Never. Buy once, use whenever you want.",
  },
  {
    q: "What if the AI fails or gives wrong output?",
    a: "Credits are automatically refunded for failed requests.",
  },
  {
    q: "Can I use credits across all tools?",
    a: "Yes, credits work on every AI tool on the platform.",
  },
  {
    q: "Is there a subscription?",
    a: "No subscriptions. Pay only for what you use.",
  },
];

export default async function PricingPage() {
  const packs = await getPacks();

  const popularPack = packs.find((p) => p.isFeatured) ?? packs[1];
  const pricePerCredit =
    popularPack && popularPack.credits > 0
      ? popularPack.priceInr / popularPack.credits
      : 1.33;

  const paidTools = TOOL_PRICING.filter((t) => t.credits > 0).sort(
    (a, b) => a.credits - b.credits
  );

  return (
    <div className="min-h-full px-4 py-12 md:px-8 lg:px-12">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Simple Credit Pricing
        </h1>
        <p className="text-muted-foreground text-lg">
          Buy once, use anytime. Credits never expire.
        </p>
      </div>

      {/* Packs grid */}
      {packs.length === 0 ? (
        <p className="text-center text-muted-foreground">No packs available.</p>
      ) : (
        <div
          className={cn(
            "mx-auto mb-16 grid gap-4",
            "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
            packs.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
            "max-w-6xl"
          )}
        >
          {packs.map((pack) => {
            const examples =
              PACK_EXAMPLES[pack.name] ?? FEATURED_EXAMPLES;
            const perCredit =
              pack.credits > 0
                ? (pack.priceInr / pack.credits).toFixed(2)
                : "0.00";

            return (
              <div
                key={pack._id.toString()}
                className={cn(
                  "relative rounded-xl border bg-surface p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg min-w-0",
                  pack.isFeatured
                    ? "border-[#7c3aed] ring-2 ring-[#7c3aed]/40"
                    : "border-border"
                )}
              >
                {pack.isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7c3aed] px-3 py-0.5 text-xs font-semibold text-white whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <p className="font-bold text-foreground">{pack.name}</p>

                <div>
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-[#7c3aed] to-[#a855f7] bg-clip-text text-transparent">
                    {pack.credits}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">credits</span>
                </div>

                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{pack.priceInr}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{perCredit} per credit
                  </p>
                </div>

                <ul className="flex flex-col gap-1.5 my-1">
                  {examples.map(({ Icon, name }) => (
                    <li key={name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-[#7c3aed] shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>

                <BuyCreditsButton
                  pack={{
                    _id: pack._id.toString(),
                    name: pack.name,
                    credits: pack.credits,
                    priceInr: pack.priceInr,
                    isFeatured: pack.isFeatured,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* What can you build */}
      <div className="mx-auto max-w-4xl mb-16">
        <h2 className="text-xl font-bold text-foreground mb-5">
          What can you build?
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/60">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Tool</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Kit</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">Credits</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">₹ Cost</th>
              </tr>
            </thead>
            <tbody>
              {paidTools.map((tool, i) => (
                <tr
                  key={tool.name}
                  className={cn(
                    "border-b border-border last:border-0",
                    i % 2 === 0 ? "bg-transparent" : "bg-surface/30"
                  )}
                >
                  <td className="px-4 py-2.5 text-foreground">{tool.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tool.kit}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-[#7c3aed]">
                    {tool.credits}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    ₹{(tool.credits * pricePerCredit).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          * Cost calculated at Popular pack rate (₹{pricePerCredit.toFixed(2)}/credit)
        </p>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl">
        <h2 className="text-xl font-bold text-foreground mb-5">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-foreground list-none hover:bg-white/5 transition-colors">
                {q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p className="px-5 pb-4 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
