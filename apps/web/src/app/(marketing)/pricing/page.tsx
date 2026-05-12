"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";


interface Pack {
  _id: string;
  name: string;
  credits: number;
  priceInr: number;
  isFeatured: boolean;
  sortOrder: number;
}

const FAQS = [
  { q: "Do credits expire?", a: "Never. Buy once, use whenever you want." },
  { q: "What if the AI fails?", a: "Credits are automatically refunded for failed requests." },
  { q: "Can I use credits across all tools?", a: "Yes, credits work on every AI tool on the platform." },
  { q: "Is there a subscription?", a: "No subscriptions. Pay only for what you use." },
];

const FALLBACK_PACKS: Pack[] = [
  { _id: "1", name: "Starter",  credits: 100,  priceInr: 99,  isFeatured: false, sortOrder: 1 },
  { _id: "2", name: "Growth",   credits: 500,  priceInr: 399, isFeatured: true,  sortOrder: 2 },
  { _id: "3", name: "Pro",      credits: 1500, priceInr: 999, isFeatured: false, sortOrder: 3 },
];

export default function MarketingPricingPage() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const [packs, setPacks] = useState<Pack[]>(FALLBACK_PACKS);

  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data) => { if (data.plans?.length) setPacks(data.plans); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen px-4 py-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          Pricing
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Simple. Transparent. Fair.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          No subscriptions. Buy credits once, use anytime. Credits never expire.
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {packs.map((pack) => {
          const perCredit = pack.credits > 0
            ? (pack.priceInr / pack.credits).toFixed(2)
            : "0.00";
          return (
            <div
              key={pack._id}
              className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                pack.isFeatured
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              {pack.isFeatured && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-full px-2.5 py-1 w-fit">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground">{pack.name}</h3>
                <div className="text-4xl font-extrabold text-foreground mt-1">
                  ₹{pack.priceInr}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {pack.credits} credits · ₹{perCredit}/credit
                </p>
              </div>
              <ul className="space-y-2 flex-1">
                {[
                  `${pack.credits} Credits`,
                  "All 27 tools access",
                  "Credits never expire",
                  "Email support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openAuthModal("signup")}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity ${
                  pack.isFeatured
                    ? "bg-primary text-white hover:opacity-90"
                    : "border border-border text-foreground hover:bg-muted/50"
                }`}
              >
                Get Started
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border border-border rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-muted/40 transition-colors">
                <span className="text-sm font-medium text-foreground pr-4">{q}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">{a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground mb-4">Ready to get started?</p>
        <button
          onClick={() => openAuthModal("signup")}
          className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          Sign Up Free — 10 Credits Included
        </button>
      </div>
    </div>
  );
}
