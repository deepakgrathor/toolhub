"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { websiteGeneratorSchema, type WebsiteGeneratorInput } from "./schema";
import { websiteGeneratorConfig } from "./config";
import {
  Globe,
  Coins,
  Loader2,
  Copy,
  Download,
  Maximize2,
  AlertTriangle,
  Target,
  Briefcase,
  ShoppingCart,
  Shield,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  X,
  MessageSquare,
  Map,
  Share2,
  Users,
  CreditCard,
  HelpCircle,
  Sparkles,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { usePresets } from "@/hooks/usePresets";
import { useWebsiteCredits } from "@/hooks/useWebsiteCredits";
import { validateImageFile } from "@/lib/file-validation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WebsiteOutput {
  htmlContent: string;
  pageTitle: string;
  sections: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Analysing your business...",
  "Building design brief...",
  "Crafting your website...",
  "Adding finishing touches...",
  "Almost ready...",
];

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", bg: "#2563eb" },
  { value: "green", label: "Green", bg: "#16a34a" },
  { value: "purple", label: "Purple", bg: "#7c3aed" },
  { value: "red", label: "Red", bg: "#dc2626" },
  { value: "orange", label: "Orange", bg: "#ea580c" },
  { value: "dark", label: "Dark", bg: "#0f172a" },
] as const;

const GOAL_OPTIONS = [
  { value: "get_leads", label: "Get Leads", Icon: Target },
  { value: "showcase_work", label: "Showcase Work", Icon: Briefcase },
  { value: "sell_products", label: "Sell Products", Icon: ShoppingCart },
  { value: "build_trust", label: "Build Trust", Icon: Shield },
] as const;

const TONE_OPTIONS = ["professional", "friendly", "bold", "luxury"] as const;

const SECTION_META = [
  { key: "testimonials", label: "Testimonials", Icon: MessageSquare, note: "Auto-generated or add manually in next step" },
  { key: "pricing", label: "Pricing Table", Icon: CreditCard, note: "Add your pricing plans in next step" },
  { key: "faq", label: "FAQ", Icon: HelpCircle, note: "Auto-generated or add manually in next step" },
  { key: "team", label: "Team", Icon: Users, note: "Add team members in next step" },
  { key: "whatsapp", label: "WhatsApp Button", Icon: MessageSquare, note: "Enter your WhatsApp number in next step" },
  { key: "maps", label: "Google Maps", Icon: Map, note: "Enter your business location in next step" },
  { key: "social", label: "Social Media", Icon: Share2, note: "Add your social links in next step" },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Step {step} of {total}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WebsiteGeneratorTool({ creditCost: creditCostProp }: { creditCost?: number }) {
  const creditCost = creditCostProp ?? websiteGeneratorConfig.creditCost;
  const { status } = useSession();
  const { balance, deductLocally } = useCreditStore();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openPaywall = usePaywallStore((s) => s.openPaywall);

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useForm<WebsiteGeneratorInput>({
    resolver: zodResolver(websiteGeneratorSchema),
    defaultValues: {
      colorScheme: "blue",
      style: "modern",
      includeContact: true,
      language: "english",
      pages: "1",
      sections: {
        testimonials: false,
        testimonialsMode: "auto",
        pricing: false,
        faq: false,
        faqMode: "auto",
        team: false,
        whatsapp: false,
        whatsappText: "Chat with us",
        maps: false,
        social: false,
      },
      animation: false,
      darkMode: false,
    },
  });

  // Field arrays
  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } =
    useFieldArray({ control, name: "sections.testimonialsList" });
  const { fields: pricingFields, append: appendPricing, remove: removePricing } =
    useFieldArray({ control, name: "sections.pricingPlans" });
  const { fields: faqFields, append: appendFaq, remove: removeFaq } =
    useFieldArray({ control, name: "sections.faqList" });
  const { fields: teamFields, append: appendTeam, remove: removeTeam } =
    useFieldArray({ control, name: "sections.teamMembers" });

  // Watch values
  const allValues = watch();
  const selectedColor = watch("colorScheme");
  const selectedStyle = watch("style");
  const includeContact = watch("includeContact");
  const selectedLanguage = watch("language");
  const selectedGoal = watch("websiteGoal");
  const selectedTone = watch("tone");
  const selectedPages = watch("pages");
  const sections = watch("sections");
  const animation = watch("animation");
  const darkMode = watch("darkMode");
  const businessName = watch("businessName");
  const description = watch("description") ?? "";

  // ── Credit calculator ─────────────────────────────────────────────────────
  const { total: totalCredits, breakdown } = useWebsiteCredits({
    pages: selectedPages,
    sections,
    animation,
    darkMode,
  });

  // ── Step management ───────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  const hasSections = sections?.testimonials || sections?.pricing || sections?.faq ||
    sections?.team || sections?.whatsapp || sections?.maps || sections?.social;

  const goNext = async () => {
    const valid = await validateCurrentStep();
    if (!valid) return;
    let next = step + 1;
    if (next === 4 && !hasSections) next = 5;
    if (next <= TOTAL_STEPS) setStep(next);
  };

  const goBack = () => {
    let prev = step - 1;
    if (prev === 4 && !hasSections) prev = 3;
    if (prev >= 1) setStep(prev);
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (step) {
      case 1:
        return trigger(["businessName", "businessType", "description", "targetAudience", "keyServices"]);
      case 2:
        return trigger(["websiteGoal", "tone"]);
      case 3:
      case 4:
      case 5:
        return true;
      default:
        return true;
    }
  };

  // ── Generation state ──────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<WebsiteOutput | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const loadingMsgRef = useRef(0);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      loadingMsgRef.current = (loadingMsgRef.current + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[loadingMsgRef.current]);
    }, 7000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // ── Logo upload ───────────────────────────────────────────────────────────
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "svg") {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB");
        return;
      }
      const text = await file.text();
      if (!text.includes("<svg")) {
        toast.error("Invalid SVG file");
        return;
      }
      const base64 = btoa(text);
      setValue("logoBase64", base64);
      setValue("logoFileName", file.name);
      setLogoPreview(`data:image/svg+xml;base64,${base64}`);
      return;
    }

    const result = await validateImageFile(file);
    if (!result.valid) {
      toast.error(result.error ?? "Invalid image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setValue("logoBase64", base64);
      setValue("logoFileName", file.name);
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setValue("logoBase64", undefined);
    setValue("logoFileName", undefined);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  // ── Presets ───────────────────────────────────────────────────────────────
  const [planSlug, setPlanSlug] = useState("free");
  const { presets, isFetched, fetchPresets } = usePresets("website-generator");
  const defaultLoadedRef = useRef(false);
  const formValues = watch() as unknown as Record<string, string>;

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d: { planSlug?: string }) => setPlanSlug(d.planSlug ?? "free"))
      .catch(() => null);
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  useEffect(() => {
    if (!isFetched || defaultLoadedRef.current) return;
    const defaultPreset = presets.find((p) => p.isDefault);
    if (defaultPreset) {
      Object.entries(defaultPreset.inputs).forEach(([key, value]) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(key as any, value as any, { shouldValidate: false })
      );
      defaultLoadedRef.current = true;
    }
  }, [isFetched, presets, setValue]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: WebsiteGeneratorInput) => {
    if (status === "unauthenticated") { openAuthModal("login"); return; }
    if (balance < totalCredits) { openPaywall(websiteGeneratorConfig.name, totalCredits); return; }

    setIsGenerating(true);
    setOutput(null);
    loadingMsgRef.current = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    try {
      const res = await fetch("/api/tools/website-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 402) { openPaywall(websiteGeneratorConfig.name, totalCredits); return; }
      if (!res.ok) throw new Error("generation_failed");
      const json = await res.json();
      setOutput(json.output as WebsiteOutput);
      deductLocally(totalCredits);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Output helpers ────────────────────────────────────────────────────────
  function openFullscreen() {
    if (!output) return;
    const blob = new Blob([output.htmlContent], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  function downloadHtml() {
    if (!output) return;
    const blob = new Blob([output.htmlContent], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(businessName || "website").toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Business Name <span className="text-destructive">*</span></label>
            <input {...register("businessName")} placeholder="e.g. Sharma Traders"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Business Type <span className="text-destructive">*</span></label>
            <input {...register("businessType")} placeholder="e.g. Restaurant, CA Firm, Salon"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.businessType && <p className="text-xs text-destructive">{errors.businessType.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Description <span className="text-destructive">*</span></label>
            <span className="text-xs text-muted-foreground">{description.length}/500</span>
          </div>
          <textarea {...register("description")} rows={3}
            placeholder="Brief description of your business, what you do, and your key value proposition..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition resize-none" />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Target Audience <span className="text-destructive">*</span></label>
            <input {...register("targetAudience")} placeholder="e.g. SMEs in Mumbai"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.targetAudience && <p className="text-xs text-destructive">{errors.targetAudience.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Key Services <span className="text-destructive">*</span></label>
            <input {...register("keyServices")} placeholder="Service 1, Service 2, Service 3"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
            {errors.keyServices && <p className="text-xs text-destructive">{errors.keyServices.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Language</label>
          <div className="flex gap-2">
            {(["english", "hindi", "hinglish"] as const).map((lang) => (
              <Pill key={lang} label={lang.charAt(0).toUpperCase() + lang.slice(1)} active={selectedLanguage === lang} onClick={() => setValue("language", lang)} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="includeContact" checked={includeContact}
              onChange={(e) => setValue("includeContact", e.target.checked)}
              className="rounded border-border accent-accent" />
            <label htmlFor="includeContact" className="text-sm font-medium text-foreground cursor-pointer">Include contact section</label>
          </div>
          {includeContact && (
            <div className="grid grid-cols-2 gap-3 pl-5 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Phone</label>
                <input {...register("phone")} placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Email</label>
                <input {...register("email")} type="email" placeholder="hello@company.com"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">What&apos;s the main goal of your website?</label>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map(({ value, label, Icon }) => (
              <button key={value} type="button" onClick={() => setValue("websiteGoal", value, { shouldValidate: true })}
                className={`flex items-center gap-2.5 rounded-xl border p-3 transition-colors text-left ${
                  selectedGoal === value
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-foreground/30"
                }`}>
                <Icon className={`h-5 w-5 shrink-0 ${selectedGoal === value ? "text-accent" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </button>
            ))}
          </div>
          {errors.websiteGoal && <p className="text-xs text-destructive">Please select a website goal</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tone & Personality</label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((t) => (
              <Pill key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={selectedTone === t}
                onClick={() => setValue("tone", t, { shouldValidate: true })} />
            ))}
          </div>
          {errors.tone && <p className="text-xs text-destructive">Please select a tone</p>}
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Number of Pages</label>
          <div className="grid grid-cols-4 gap-2">
            {(["1", "2", "3", "4"] as const).map((p, idx) => {
              const label = `${p} Page${Number(p) > 1 ? "s" : ""}`;
              const costLabel = idx === 0 ? "Base" : `+${breakdown.find(b => b.label.includes(["", "2nd", "3rd", "4th"][idx]))?.credits ?? 15}cr`;
              return (
                <button key={p} type="button" onClick={() => setValue("pages", p)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors ${
                    selectedPages === p ? "border-accent bg-accent/10" : "border-border hover:border-foreground/30"
                  }`}>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">{costLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Add Sections</label>
          <div className="grid grid-cols-2 gap-2">
            {SECTION_META.map(({ key, label, Icon, note }) => {
              const isActive = sections?.[key as keyof typeof sections] as boolean ?? false;
              const creditKey = key as "testimonials" | "pricing" | "faq" | "team" | "whatsapp" | "maps" | "social";
              const creditItem = breakdown.find(b => b.label.toLowerCase().includes(key === "whatsapp" ? "whatsapp" : key === "maps" ? "google" : key === "social" ? "social" : key));
              const creditVal = creditItem?.credits;
              return (
                <div key={key} className={`rounded-xl border p-3 transition-colors ${isActive ? "border-accent/50 bg-accent/5" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {creditVal && <span className="text-xs text-muted-foreground">+{creditVal}cr</span>}
                      <button type="button"
                        onClick={() => setValue(`sections.${creditKey}` as `sections.${typeof creditKey}`, !isActive)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? "bg-accent" : "bg-border"}`}>
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${isActive ? "translate-x-4.5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                  {isActive && (
                    <p className="text-xs text-muted-foreground mt-2 animate-in fade-in duration-200">{note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Testimonials */}
        {sections?.testimonials && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Testimonials</h3>
              <div className="flex gap-2">
                <Pill label="Auto-generate" active={sections.testimonialsMode === "auto"}
                  onClick={() => setValue("sections.testimonialsMode", "auto")} />
                <Pill label="Add manually" active={sections.testimonialsMode === "manual"}
                  onClick={() => setValue("sections.testimonialsMode", "manual")} />
              </div>
            </div>
            {sections.testimonialsMode === "manual" && (
              <div className="space-y-2">
                {testimonialFields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_2fr_auto_auto] gap-2 items-start">
                    <input {...register(`sections.testimonialsList.${idx}.name`)} placeholder="Name"
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <input {...register(`sections.testimonialsList.${idx}.role`)} placeholder="Role"
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <input {...register(`sections.testimonialsList.${idx}.review`)} placeholder="Review text"
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <input {...register(`sections.testimonialsList.${idx}.rating`, { valueAsNumber: true })} type="number" min={1} max={5} placeholder="1-5"
                      className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <button type="button" onClick={() => removeTestimonial(idx)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {testimonialFields.length < 10 && (
                  <button type="button" onClick={() => appendTestimonial({ name: "", role: "", review: "", rating: 5 })}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add Testimonial
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pricing */}
        {sections?.pricing && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <h3 className="text-sm font-medium text-foreground">Pricing Plans</h3>
            <div className="space-y-2">
              {pricingFields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-[1fr_auto_2fr_auto_auto] gap-2 items-start">
                  <input {...register(`sections.pricingPlans.${idx}.name`)} placeholder="Plan name"
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <input {...register(`sections.pricingPlans.${idx}.price`)} placeholder="₹999"
                    className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <input {...register(`sections.pricingPlans.${idx}.features.0`)} placeholder="Features (comma separated)"
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" {...register(`sections.pricingPlans.${idx}.highlighted`)} className="accent-accent" />
                    <span>HL</span>
                  </label>
                  <button type="button" onClick={() => removePricing(idx)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {pricingFields.length < 5 && (
                <button type="button" onClick={() => appendPricing({ name: "", price: "", features: [], highlighted: false })}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium">
                  <Plus className="h-3.5 w-3.5" /> Add Plan
                </button>
              )}
            </div>
          </div>
        )}

        {/* FAQ */}
        {sections?.faq && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">FAQ</h3>
              <div className="flex gap-2">
                <Pill label="Auto-generate" active={sections.faqMode === "auto"}
                  onClick={() => setValue("sections.faqMode", "auto")} />
                <Pill label="Add manually" active={sections.faqMode === "manual"}
                  onClick={() => setValue("sections.faqMode", "manual")} />
              </div>
            </div>
            {sections.faqMode === "manual" && (
              <div className="space-y-2">
                {faqFields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-start">
                    <input {...register(`sections.faqList.${idx}.question`)} placeholder="Question"
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <input {...register(`sections.faqList.${idx}.answer`)} placeholder="Answer"
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <button type="button" onClick={() => removeFaq(idx)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {faqFields.length < 15 && (
                  <button type="button" onClick={() => appendFaq({ question: "", answer: "" })}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add FAQ
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Team */}
        {sections?.team && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <h3 className="text-sm font-medium text-foreground">Team Members</h3>
            <div className="space-y-2">
              {teamFields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-start">
                  <input {...register(`sections.teamMembers.${idx}.name`)} placeholder="Name"
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <input {...register(`sections.teamMembers.${idx}.role`)} placeholder="Role"
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <input {...register(`sections.teamMembers.${idx}.bio`)} placeholder="Bio (optional)"
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <button type="button" onClick={() => removeTeam(idx)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {teamFields.length < 10 && (
                <button type="button" onClick={() => appendTeam({ name: "", role: "" })}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium">
                  <Plus className="h-3.5 w-3.5" /> Add Member
                </button>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp */}
        {sections?.whatsapp && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <h3 className="text-sm font-medium text-foreground">WhatsApp Button</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">WhatsApp Number</label>
                <input {...register("sections.whatsappNumber")} placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Button Text</label>
                <input {...register("sections.whatsappText")} placeholder="Chat with us"
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
              </div>
            </div>
          </div>
        )}

        {/* Google Maps */}
        {sections?.maps && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <h3 className="text-sm font-medium text-foreground">Google Maps</h3>
            <div className="space-y-1.5">
              <input {...register("sections.mapsQuery")} placeholder="Sharma Catering Services, Indore"
                className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
              <p className="text-xs text-muted-foreground">Enter your business name exactly as it appears on Google Maps</p>
            </div>
          </div>
        )}

        {/* Social Media */}
        {sections?.social && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <h3 className="text-sm font-medium text-foreground">Social Media Links</h3>
            <div className="grid grid-cols-2 gap-2">
              <input {...register("sections.socialLinks.instagram")} placeholder="Instagram URL"
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
              <input {...register("sections.socialLinks.facebook")} placeholder="Facebook URL"
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
              <input {...register("sections.socialLinks.linkedin")} placeholder="LinkedIn URL"
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
              <input {...register("sections.socialLinks.twitter")} placeholder="Twitter / X URL"
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
              <input {...register("sections.socialLinks.youtube")} placeholder="YouTube URL"
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Color Scheme</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(({ value, label, bg }) => (
              <button key={value} type="button" onClick={() => setValue("colorScheme", value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  selectedColor === value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}>
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: bg }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Style</label>
          <div className="flex flex-wrap gap-2">
            {(["modern", "minimal", "corporate", "creative"] as const).map((s) => (
              <Pill key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={selectedStyle === s} onClick={() => setValue("style", s)} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Extras</label>
          <div className="space-y-2">
            <div className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${animation ? "border-accent/50 bg-accent/5" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Animation Pack</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">+{breakdown.find(b => b.label.includes("Animation"))?.credits ?? 5}cr</span>
                <button type="button" onClick={() => setValue("animation", !animation)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${animation ? "bg-accent" : "bg-border"}`}>
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${animation ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
            <div className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${darkMode ? "border-accent/50 bg-accent/5" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Dark Mode Toggle</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">+{breakdown.find(b => b.label.includes("Dark"))?.credits ?? 5}cr</span>
                <button type="button" onClick={() => setValue("darkMode", !darkMode)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${darkMode ? "bg-accent" : "bg-border"}`}>
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${darkMode ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Logo (optional)</label>
          {!logoPreview ? (
            <div
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); }}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG — max 2MB</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <img src={logoPreview} alt="Logo preview" className="h-12 w-12 object-contain rounded-lg border border-border" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{watch("logoFileName")}</p>
                <p className="text-xs text-muted-foreground">Favicon will be auto-created from your logo</p>
              </div>
              <button type="button" onClick={removeLogo} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
          <p className="text-xs text-muted-foreground">Your logo will be embedded directly in the website</p>
        </div>
      </div>
    );
  }

  function renderCreditMeter() {
    return (
      <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-2">
        <div className="space-y-1">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-foreground font-medium">{item.credits}cr</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="text-sm font-bold text-accent">{totalCredits}cr</span>
        </div>
      </div>
    );
  }

  function renderGenerateButton() {
    if (status === "unauthenticated") {
      return (
        <button type="button" onClick={() => openAuthModal("login")}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Login to Generate
        </button>
      );
    }
    if (balance < totalCredits) {
      return (
        <button type="button" onClick={() => openPaywall(websiteGeneratorConfig.name, totalCredits)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
          <Coins className="h-4 w-4" />Buy Credits
        </button>
      );
    }
    return (
      <div className="space-y-1">
        <button type="submit" disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{loadingMsg}</>
          ) : (
            <><Coins className="h-4 w-4" />Generate Website — {totalCredits}cr</>
          )}
        </button>
        {!isGenerating && (
          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" />Takes 30–45 seconds
          </p>
        )}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <Globe className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{websiteGeneratorConfig.name}</h1>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{totalCredits} credits</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{websiteGeneratorConfig.description}</p>
          </div>
        </div>

        {/* Preset selector — only on step 1 */}
        {step === 1 && (
          <div className="mb-4">
            <PresetSelector
              toolSlug="website-generator"
              currentInputs={formValues}
              planSlug={planSlug}
              onPresetLoad={(inputs) => {
                Object.entries(inputs).forEach(([key, value]) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setValue(key as any, value as any, { shouldValidate: false })
                );
                toast.success("Preset loaded!");
              }}
            />
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>

          {/* Navigation + Credit meter + Generate */}
          <div className="mt-4 space-y-3 pt-3 border-t border-border">
            {/* Navigation */}
            <div className="flex items-center justify-between gap-2">
              {step > 1 ? (
                <button type="button" onClick={goBack}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>
              ) : <div />}
              {step < TOTAL_STEPS ? (
                <button type="button" onClick={goNext}
                  className="flex items-center gap-1 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : <div />}
            </div>

            {/* Credit meter */}
            {renderCreditMeter()}

            {/* Generate button — only on last step */}
            {step === TOTAL_STEPS && renderGenerateButton()}
          </div>
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[55%] p-4 md:p-6 overflow-y-auto">
        {!isGenerating && !output && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/50 p-8">
            <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Your website will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Fill in your business details and generate</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-sm font-semibold text-foreground">Generating your website...</p>
            <p className="text-xs text-muted-foreground">{loadingMsg}</p>
            <p className="text-xs text-muted-foreground">This takes 30–45 seconds</p>
          </div>
        )}

        {!isGenerating && output && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap gap-1">
                {output.sections.map((s) => (
                  <span key={s} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{s}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={openFullscreen}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Maximize2 className="h-3.5 w-3.5" />Full Screen
                </button>
                <button type="button" onClick={downloadHtml}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Download className="h-3.5 w-3.5" />Download HTML
                </button>
                <button type="button" onClick={() => { navigator.clipboard.writeText(output.htmlContent); toast.success("HTML copied"); }}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                  <Copy className="h-3.5 w-3.5" />Copy
                </button>
              </div>
            </div>

            <iframe
              srcDoc={output.htmlContent}
              title={output.pageTitle}
              className="w-full rounded-xl border border-border"
              style={{ height: "500px" }}
              sandbox="allow-scripts allow-same-origin"
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{totalCredits} credits used</p>
              <button type="button" disabled
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground cursor-not-allowed opacity-60"
                title="Coming in next update">
                <Globe className="h-3.5 w-3.5" /> Publish Website
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
