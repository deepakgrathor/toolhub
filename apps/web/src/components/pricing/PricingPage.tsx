"use client";

import { useState } from "react";
import { Check, X, Mail, Package, Lock, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight: string; // empty = no tag, non-empty = tag label
}

export interface PlanPricing {
  basePrice: number;
  pricePerCredit: number;
  baseCredits: number;
  maxCredits: number;
  discountPercent?: number;
}

export interface Plan {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  isPopular: boolean;
  type: "free" | "credit" | "enterprise";
  pricing: {
    monthly: PlanPricing;
    yearly: PlanPricing;
  };
  features: PlanFeature[];
  usageExamples?: string[];
}

export interface CreditPackData {
  _id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  isPopular: boolean;
}

export interface RolloverConfig {
  enabled: boolean;
  maxDays: number;
}

interface Props {
  plans: Plan[];
  packs: CreditPackData[];
  rollover: RolloverConfig;
}

// ── Billing toggle ────────────────────────────────────────────────────────────

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: "monthly" | "yearly";
  onChange: (c: "monthly" | "yearly") => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-muted/20 border border-border w-fit mx-auto">
      {(["monthly", "yearly"] as const).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            cycle === c
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {c === "monthly" ? "Monthly" : "Annually"}
        </button>
      ))}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  cycle,
  onCtaClick,
}: {
  plan: Plan;
  cycle: "monthly" | "yearly";
  onCtaClick: (slug: string) => void;
}) {
  const pricing = plan.pricing[cycle];
  const monthlyPricing = plan.pricing.monthly;

  const ctaLabels: Record<string, string> = {
    free:       "Get Started Free",
    lite:       "Start Creating",
    pro:        "Upgrade to Pro",
    business:   "Start Business Plan",
    enterprise: "Contact Sales",
  };
  const ctaLabel = ctaLabels[plan.slug] ?? "Get Started";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 gap-5 transition-shadow",
        plan.isPopular
          ? "border-[#7c3aed] bg-[#7c3aed]/5 shadow-xl shadow-[#7c3aed]/15 ring-1 ring-[#7c3aed]/30 scale-[1.02]"
          : "border-border bg-card hover:shadow-md"
      )}
    >
      {/* Most Popular badge */}
      {plan.isPopular && (
        <div className="absolute text-center -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-block rounded-full bg-gradient-to-r from-[#7c3aed] to-purple-400 px-3.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{plan.tagline}</p>
      </div>

      {/* Pricing */}
      <div>
        {plan.type === "free" && (
          <div className="text-3xl font-extrabold text-foreground">
            ₹0
            <span className="text-base font-normal text-muted-foreground ml-1">/ forever</span>
          </div>
        )}

        {plan.type === "credit" && (
          <div>
            {cycle === "yearly" && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground line-through">
                  ₹{monthlyPricing.basePrice}/mo
                </span>
                <span className="rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-semibold px-2 py-0.5">
                  Save 20%
                </span>
              </div>
            )}
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold text-foreground">
                ₹{pricing.basePrice}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/mo</span>
            </div>
            {cycle === "yearly" && (
              <p className="text-xs text-muted-foreground mt-1">
                Billed annually (₹{pricing.basePrice * 12}/year)
              </p>
            )}
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {pricing.baseCredits.toLocaleString()} credits/month
            </p>
          </div>
        )}

        {plan.type === "enterprise" && (
          <div className="text-2xl font-bold text-foreground">Custom pricing</div>
        )}
      </div>

      {/* CTA */}
      {plan.type === "enterprise" ? (
        <a
          href="mailto:talk.enterprise@setulix.com"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
        >
          <Mail className="h-4 w-4" />
          {ctaLabel}
        </a>
      ) : (
        <button
          onClick={() => onCtaClick(plan.slug)}
          className={cn(
            "w-full rounded-xl py-2.5 text-sm font-semibold text-center transition-colors",
            plan.isPopular
              ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              : plan.type === "free"
              ? "border border-border text-foreground hover:bg-muted/40"
              : "bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/30 hover:bg-[#7c3aed]/20"
          )}
        >
          {ctaLabel}
        </button>
      )}

      {/* Features */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {plan.slug === "free"
            ? "Includes:"
            : plan.slug === "lite"
            ? "Everything in Free, plus:"
            : plan.slug === "pro"
            ? "Everything in Lite, plus:"
            : plan.slug === "business"
            ? "Everything in Pro, plus:"
            : "Everything in Business, plus:"}
        </p>
        <ul className="space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {f.included ? (
                <Check className="h-4 w-4 text-[#10b981] shrink-0 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
              )}
              <span className={cn(f.included ? "text-foreground" : "text-muted-foreground")}>
                {f.text}
              </span>
              {f.highlight && (
                <span className="shrink-0 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-semibold px-1.5 py-0.5">
                  {f.highlight}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Usage examples */}
      {plan.usageExamples && plan.usageExamples.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
          {plan.usageExamples.map((ex, i) => (
            <span
              key={i}
              className="rounded-full bg-muted/10 text-muted-foreground text-xs px-2.5 py-1"
            >
              {ex}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Credit pack card ──────────────────────────────────────────────────────────

function PackCard({
  pack,
  onBuy,
}: {
  pack: CreditPackData;
  onBuy: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-5 gap-4",
        pack.isPopular
          ? "border-[#7c3aed] bg-[#7c3aed]/5 ring-1 ring-[#7c3aed]/20"
          : "border-border bg-card"
      )}
    >
      {pack.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block rounded-full bg-[#10b981] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Best Value
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-[#7c3aed]" />
        <span className="font-semibold text-foreground">{pack.name}</span>
      </div>

      <div>
        <div className="text-3xl font-extrabold text-foreground">
          {pack.credits.toLocaleString()}
          <span className="text-base font-normal text-muted-foreground ml-1">credits</span>
        </div>
        <div className="text-xl font-bold text-foreground mt-1">₹{pack.price}</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          ₹{(pack.credits > 0 ? pack.price / pack.credits : 0).toFixed(2)}/credit · One-time
        </p>
      </div>

      <button
        onClick={() => onBuy(pack._id)}
        className="w-full rounded-xl py-2 text-sm font-semibold text-center bg-[#7c3aed] text-white hover:opacity-90 transition-opacity"
      >
        Buy Now
      </button>
    </div>
  );
}

// ── Lock note ─────────────────────────────────────────────────────────────────

function PlanLockNote() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground max-w-xl mx-auto">
      <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span>
        Fair usage applies. Credits reset monthly on billing date. One-time pack credits never expire.
      </span>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Do monthly credits expire?", a: "Monthly plan credits reset on your billing date each month. One-time credit pack credits never expire." },
  { q: "What if the AI fails?", a: "Credits are automatically refunded for failed requests." },
  { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade your plan at any time." },
  { q: "Is there a free trial?", a: "Every new account starts with 10 free welcome credits — no card needed." },
  { q: "What is the annual discount?", a: "Switching to annual billing saves you 20% vs. monthly. Billed once per year." },
];

// ── Main component ────────────────────────────────────────────────────────────

export function PricingPage({ plans, packs, rollover }: Props) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const { data: session } = useSession();
  const router = useRouter();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  function handlePlanCta(slug: string) {
    if (session) {
      if (slug === "free") {
        router.push("/dashboard");
      } else {
        router.push(`/checkout?type=plan&slug=${slug}&cycle=${cycle}`);
      }
    } else {
      if (slug !== "free") {
        localStorage.setItem("pending_plan", slug);
        localStorage.setItem("pending_plan_cycle", cycle);
      }
      openAuthModal("signup");
    }
  }

  function handlePackBuy(packId: string) {
    if (session) {
      router.push(`/checkout?type=pack&id=${packId}`);
    } else {
      localStorage.setItem("pending_pack_id", packId);
      openAuthModal("signup");
    }
  }

  return (
    <div className="min-h-screen px-4 py-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-3 py-1 text-xs font-medium text-[#7c3aed] mb-4">
          Pricing
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Start free. Scale as you grow. Only pay for what you need.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="mb-8">
        <BillingToggle cycle={cycle} onChange={setCycle} />
      </div>

      {/* Annual savings banner */}
      {cycle === "yearly" && (
        <div className="mb-8 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-sm font-medium text-center py-3 px-4">
          Save 20% with annual billing — billed once per year
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6 items-start">
        {plans.map((plan) => (
          <PlanCard key={plan._id} plan={plan} cycle={cycle} onCtaClick={handlePlanCta} />
        ))}
      </div>

      {/* Fair usage footnote */}
      <div className="mb-4">
        <PlanLockNote />
      </div>

      {/* Rollover info */}
      {rollover.enabled && (
        <p className="text-sm text-muted-foreground text-center mb-12">
          <Check className="inline h-4 w-4 text-[#10b981] mr-1" />
          Unused credits roll over for up to {rollover.maxDays} days
        </p>
      )}

      {!rollover.enabled && <div className="mb-12" />}

      {/* Credit packs section */}
      {packs.length > 0 && (
        <div id="credit-packs" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Need more credits? Buy a pack.
            </h2>
            <p className="text-muted-foreground">One-time purchase. Credits never expire.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {packs.map((pack) => (
              <PackCard key={pack._id} pack={pack} onBuy={handlePackBuy} />
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
