"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles, Building2, Users, Scale, Megaphone, HelpCircle,
  User, Users2, Building, Briefcase,
  Clock, Star, DollarSign, ShieldCheck,
  ArrowRight, ArrowLeft, Pencil, Check, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolIcon } from "@/lib/tool-icons";

// ── Static config (fallback when DB is unreachable) ──────────────────────────

const PROFESSION_OPTIONS = [
  { value: "creator",  label: "Content Creator",  icon: "Sparkles",   subtitle: "Scripts, thumbnails, hooks, captions", kitName: "{name} Creator Pro" },
  { value: "sme",      label: "Business Owner",   icon: "Building2",  subtitle: "GST invoice, expense, quotation",      kitName: "{name} Business Hub" },
  { value: "hr",       label: "HR Professional",  icon: "Users",      subtitle: "JD, offer letter, appraisal",          kitName: "{name} HR Suite" },
  { value: "legal",    label: "CA / Legal Pro",   icon: "Scale",      subtitle: "Legal notices, NDAs, disclaimers",     kitName: "{name} Legal Pro" },
  { value: "marketer", label: "Marketer",         icon: "Megaphone",  subtitle: "Ad copy, LinkedIn bio, email",         kitName: "{name} Marketing Pro" },
  { value: "other",    label: "Something Else",   icon: "HelpCircle", subtitle: "Explore all 27 tools",                 kitName: "{name} AI Workspace" },
];

const TEAM_OPTIONS = [
  { value: "solo",  label: "Solo",  icon: "User",      subtitle: "Just me" },
  { value: "2-10",  label: "2-10",  icon: "Users2",    subtitle: "Small team" },
  { value: "11-50", label: "11-50", icon: "Building",  subtitle: "Growing team" },
  { value: "50+",   label: "50+",   icon: "Briefcase", subtitle: "Large org" },
];

const CHALLENGE_OPTIONS = [
  { value: "time",       label: "Time Saving",           icon: "Clock",       subtitle: "Automate repetitive tasks" },
  { value: "quality",    label: "Quality Improvement",   icon: "Star",        subtitle: "Better output every time" },
  { value: "cost",       label: "Cost Reduction",        icon: "DollarSign",  subtitle: "Do more with less" },
  { value: "compliance", label: "Compliance & Legal",    icon: "ShieldCheck", subtitle: "Stay audit-ready" },
];

const PROFESSION_TOOLS: Record<string, string[]> = {
  creator:  ["blog-generator", "yt-script", "hook-writer", "caption-generator", "thumbnail-ai", "title-generator"],
  sme:      ["gst-invoice", "expense-tracker", "quotation-generator", "qr-generator", "website-generator", "gst-calculator"],
  hr:       ["jd-generator", "resume-screener", "appraisal-draft", "policy-generator", "offer-letter", "salary-slip"],
  legal:    ["legal-notice", "nda-generator", "legal-disclaimer", "gst-calculator", "tds-sheet", "whatsapp-bulk"],
  marketer: ["ad-copy", "caption-generator", "email-subject", "linkedin-bio", "hook-writer", "seo-auditor"],
  other:    ["blog-generator", "yt-script", "gst-invoice", "jd-generator", "ad-copy", "qr-generator"],
};

const TOOL_NAMES: Record<string, string> = {
  "blog-generator": "Blog Generator", "yt-script": "YT Script", "hook-writer": "Hook Writer",
  "caption-generator": "Caption Gen", "thumbnail-ai": "Thumbnail AI", "title-generator": "Title Gen",
  "gst-invoice": "GST Invoice", "expense-tracker": "Expense Tracker", "quotation-generator": "Quotation Gen",
  "qr-generator": "QR Generator", "website-generator": "Website Gen", "gst-calculator": "GST Calculator",
  "jd-generator": "JD Generator", "resume-screener": "Resume Screener", "appraisal-draft": "Appraisal Draft",
  "policy-generator": "Policy Gen", "offer-letter": "Offer Letter", "salary-slip": "Salary Slip",
  "legal-notice": "Legal Notice", "nda-generator": "NDA Generator", "legal-disclaimer": "Legal Disclaimer",
  "tds-sheet": "TDS Sheet", "whatsapp-bulk": "WhatsApp Bulk",
  "ad-copy": "Ad Copy", "email-subject": "Email Subject", "linkedin-bio": "LinkedIn Bio",
  "seo-auditor": "SEO Auditor",
};

// ── Icon resolver ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Building2, Users, Scale, Megaphone, HelpCircle,
  User, Users2, Building, Briefcase,
  Clock, Star, DollarSign, ShieldCheck,
};

function DynIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? HelpCircle;
  return <Icon className={className} />;
}

// ── Option card ───────────────────────────────────────────────────────────────

interface OptionCardProps {
  value: string;
  label: string;
  icon: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ value: _value, label, icon, subtitle, selected, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-150",
        "hover:border-primary/50 hover:bg-primary/5",
        selected
          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
          : "border-border bg-card"
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <DynIcon name={icon} className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
    </button>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>Step {step} of {total}</span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [challenge, setChallenge] = useState("");
  const [kitName, setKitName] = useState("");
  const [editingKit, setEditingKit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] ?? "You";

  // Generate kit name when profession selected
  useEffect(() => {
    if (profession) {
      const opt = PROFESSION_OPTIONS.find((o) => o.value === profession);
      if (opt) {
        setKitName(opt.kitName.replace("{name}", firstName));
      }
    }
  }, [profession, firstName]);

  // Redirect to dashboard if already onboarded
  useEffect(() => {
    if (status === "authenticated" && session?.user?.onboardingCompleted) {
      router.replace("/dashboard");
    }
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, session, router]);

  async function saveStep(nextStep: number) {
    try {
      await fetch("/api/onboarding/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: nextStep, data: {} }),
      });
    } catch {
      // non-critical
    }
  }

  function goNext() {
    const next = step + 1;
    setStep(next);
    saveStep(next);
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleComplete() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession, teamSize, challenge, kitName }),
      });
      if (res.ok) {
        // Force a full page reload so NextAuth JWT is refreshed with onboardingCompleted=true
        window.location.href = "/dashboard";
      }
    } catch {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const recommendedSlugs = PROFESSION_TOOLS[profession] ?? [];

  return (
    <div className="w-full max-w-2xl">
      <ProgressBar step={step} total={4} />

      {/* ── Step 1: Profession ── */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Aap mainly kya karte hain?</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Hum aapka AI workspace personalise karenge.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROFESSION_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                {...opt}
                selected={profession === opt.value}
                onClick={() => setProfession(opt.value)}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              disabled={!profession}
              onClick={goNext}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Team Size ── */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Aapki team kitni badi hai?</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Hum sahi tools suggest karenge.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TEAM_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                {...opt}
                selected={teamSize === opt.value}
                onClick={() => setTeamSize(opt.value)}
              />
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={!teamSize}
              onClick={goNext}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Biggest Challenge ── */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Aapki sabse badi problem kya hai?</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Hum iske hisaab se tools recommend karenge.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CHALLENGE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                {...opt}
                selected={challenge === opt.value}
                onClick={() => setChallenge(opt.value)}
              />
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={!challenge}
              onClick={goNext}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Kit Name + Launch ── */}
      {step === 4 && (
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Aapka AI Workspace Ready Hai!
            </h1>
            <p className="text-sm text-muted-foreground">
              Hum ne banaya aapke liye ek personalized workspace.
            </p>
          </div>

          {/* Editable kit name */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Aapka Workspace Naam
            </label>
            <div className="relative">
              <input
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
                onFocus={() => setEditingKit(true)}
                onBlur={() => setEditingKit(false)}
                className={cn(
                  "w-full rounded-xl border bg-card px-4 py-3 text-base font-semibold text-foreground outline-none transition-all",
                  editingKit ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
                placeholder="My AI Workspace"
              />
              <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Click to edit your workspace name.</p>
          </div>

          {/* Recommended tools */}
          <div className="mb-8">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Recommended Tools ({recommendedSlugs.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendedSlugs.map((slug) => {
                const Icon = getToolIcon(slug);
                return (
                  <span
                    key={slug}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground"
                  >
                    <Icon className="h-3 w-3 text-primary" />
                    {TOOL_NAMES[slug] ?? slug}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={handleComplete}
              disabled={submitting || !kitName.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Launching...</>
              ) : (
                <>Launch My Workspace <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
