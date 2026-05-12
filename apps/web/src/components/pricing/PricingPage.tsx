"use client";

import { useState } from "react";
import {
  Check,
  X,
  Coins,
  ChevronDown,
  Mail,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight: boolean;
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
  yearlySavings?: number;
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

// ── Toggle ────────────────────────────────────────────────────────────────────

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: "monthly" | "yearly";
  onChange: (c: "monthly" | "yearly") => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-muted/30 border border-border w-fit mx-auto">
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
          {c === "monthly" ? "Monthly" : "Annually · Save 30%"}
        </button>
      ))}
    </div>
  );
}

// ── Credit Slider ─────────────────────────────────────────────────────────────

function CreditSlider({
  min,
  max,
  value,
  onChange,
  pricePerCredit,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  pricePerCredit: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-foreground font-medium">
          <Coins className="h-4 w-4 text-[#7c3aed]" />
          <span>{value.toLocaleString()} credits / month</span>
        </div>
        <span className="text-xs text-muted-foreground">
          ₹{pricePerCredit.toFixed(2)}/credit
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-[#7c3aed] cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  cycle,
}: {
  plan: Plan;
  cycle: "monthly" | "yearly";
}) {
  const pricing = plan.pricing[cycle];
  const [selectedCredits, setSelectedCredits] = useState(pricing.baseCredits);

  const extraCredits = Math.max(0, selectedCredits - pricing.baseCredits);
  const extraCost = extraCredits * pricing.pricePerCredit;
  const totalMonthly = pricing.basePrice + extraCost;
  const totalYearly = totalMonthly * 12 * 0.7;

  const monthlyPricing = plan.pricing.monthly;
  const monthlyBase = monthlyPricing.basePrice + Math.max(0, selectedCredits - monthlyPricing.baseCredits) * monthlyPricing.pricePerCredit;
  const yearlySavings = cycle === "yearly" ? Math.round(monthlyBase * 12 - totalYearly) : 0;

  const featureHeader =
    plan.slug === "free"
      ? "Includes:"
      : plan.slug === "starter"
      ? "Everything in Free, plus:"
      : plan.slug === "pro"
      ? "Everything in Starter, plus:"
      : "Everything in Pro, plus:";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 gap-5 transition-shadow",
        plan.isPopular
          ? "border-[#7c3aed] bg-[#7c3aed]/5 shadow-lg shadow-[#7c3aed]/10 ring-1 ring-[#7c3aed]/30"
          : "border-border bg-card hover:shadow-md"
      )}
    >
      {/* Popular badge */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black shadow-sm">
            Best Value
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
              <div className="text-sm text-muted-foreground line-through">
                ₹{Math.round(monthlyBase)}/mo
              </div>
            )}
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold text-foreground">
                ₹{Math.round(cycle === "yearly" ? totalYearly / 12 : totalMonthly)}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/mo</span>
            </div>
            {cycle === "yearly" && (
              <span className="inline-block rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-semibold px-2 py-0.5 mt-1">
                Save ₹{Math.round(yearlySavings).toLocaleString()}/year
              </span>
            )}
            {cycle === "monthly" && (
              <p className="text-xs text-muted-foreground mt-1">
                ₹{pricing.pricePerCredit.toFixed(2)}/credit
              </p>
            )}
          </div>
        )}

        {plan.type === "enterprise" && (
          <div className="text-2xl font-bold text-foreground">Custom pricing</div>
        )}
      </div>

      {/* Slider */}
      {plan.type === "credit" && (
        <CreditSlider
          min={pricing.baseCredits}
          max={pricing.maxCredits}
          value={selectedCredits}
          onChange={setSelectedCredits}
          pricePerCredit={pricing.pricePerCredit}
        />
      )}

      {/* CTA Button */}
      {plan.type === "free" && (
        <a
          href="/dashboard"
          className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-center text-foreground hover:bg-muted/50 transition-colors"
        >
          Get Started Free
        </a>
      )}

      {plan.type === "credit" && (
        <button
          disabled
          title="Payments coming soon"
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-center cursor-not-allowed opacity-60 bg-[#7c3aed] text-white"
        >
          Coming Soon
        </button>
      )}

      {plan.type === "enterprise" && (
        <a
          href="mailto:talk.enterprise@toolspire.io"
          className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-center text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Contact Sales
        </a>
      )}

      {/* Feature list */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {featureHeader}
        </p>
        <ul className="space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {f.included ? (
                <Check className="h-4 w-4 text-[#10b981] shrink-0 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
              )}
              <span
                className={cn(
                  f.included ? "text-foreground" : "text-muted-foreground",
                  f.highlight && "font-semibold text-[#7c3aed]"
                )}
              >
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Credit Pack Card ──────────────────────────────────────────────────────────

function PackCard({ pack }: { pack: CreditPackData }) {
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
          <span className="inline-block rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Popular
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
          ₹{(pack.pricePerCredit ?? (pack.credits > 0 ? pack.price / pack.credits : 0)).toFixed(2)}/credit · One-time
        </p>
      </div>

      <button
        disabled
        title="Payments coming soon"
        className="w-full rounded-xl py-2 text-sm font-semibold text-center cursor-not-allowed opacity-60 bg-[#7c3aed] text-white"
      >
        Coming Soon
      </button>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Do credits expire?", a: "Credits never expire — buy once, use whenever you want." },
  { q: "What if the AI fails?", a: "Credits are automatically refunded for failed requests." },
  { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade your plan at any time." },
  { q: "Is there a free trial?", a: "Yes — every new account starts with free credits for you to try the platform." },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function PricingPage({ plans, packs, rollover }: Props) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen px-4 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-3 py-1 text-xs font-medium text-[#7c3aed] mb-4">
          Pricing
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Start free. Scale as you grow. Only pay for what you use.
        </p>
      </div>

      {/* Toggle */}
      <div className="mb-8">
        <BillingToggle cycle={cycle} onChange={setCycle} />
      </div>

      {/* Yearly savings banner */}
      {cycle === "yearly" && (
        <div className="mb-8 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#7c3aed] text-sm font-medium text-center py-3 px-4">
          Save up to 30% with yearly billing
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {plans.map((plan) => (
          <PlanCard key={plan._id} plan={plan} cycle={cycle} />
        ))}
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
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Need more credits? Buy a pack.
            </h2>
            <p className="text-muted-foreground">One-time purchase. Never expires.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {packs.map((pack) => (
              <PackCard key={pack._id} pack={pack} />
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
