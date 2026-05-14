"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { personas } from "@/data/personas";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Quote,
  AlertCircle,
  ChevronRight,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const colorMap: Record<
  string,
  { bg: string; text: string; border: string; badge: string }
> = {
  teal: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/20",
    badge: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/20",
    badge: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  },
};

function getInitials(name: string): string {
  const parts = name
    .replace(/^Adv\.\s*/, "")
    .trim()
    .split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function PersonaJourney() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const [activeId, setActiveId] = useState("hr");
  const active = personas.find((p) => p.id === activeId)!;
  const c = colorMap[active.color];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
            Real people. Real workflows. Real results.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            See how professionals across India use SetuLix every day.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-hide justify-start sm:justify-center">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                "transition-all duration-200 border",
                activeId === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/10 text-foreground border-border hover:bg-muted transition-colors",
              )}
            >
              {p.tab}
            </button>
          ))}
        </div>

        {/* Animated tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* ── SECTION 1: Hero Strip ─────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                {/* Left: avatar + info */}
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shrink-0 text-base font-bold",
                      c.bg,
                      c.text,
                    )}
                  >
                    {getInitials(active.name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {active.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {active.role}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={13} className="shrink-0" />
                      {active.city}
                    </p>
                    <span
                      className={cn(
                        "inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mt-2",
                        c.badge,
                      )}
                    >
                      {active.kitBadge}
                    </span>
                  </div>
                </div>

                {/* Right: quote */}
                <div className="sm:ml-auto sm:max-w-sm">
                  <Quote size={18} className={cn("mb-2", c.text)} />
                  <p className="text-lg italic text-muted-foreground leading-relaxed">
                    {active.quote}
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Pain Block ─────────────────────────────────────── */}
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-500/5 dark:bg-red-950/20 p-6 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle
                  size={16}
                  className="text-red-600 dark:text-red-400 shrink-0"
                />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  The real problem before SetuLix
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                {active.painStory}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {active.painChips.map((chip) => (
                  <span
                    key={chip}
                    className="text-xs px-3 py-1 rounded-full border bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* ── SECTION 3: Journey Steps ──────────────────────────────────── */}
            <div className="mt-6 overflow-x-auto pb-2">
              <div className="flex gap-0 min-w-max sm:min-w-0 sm:grid sm:grid-cols-4">
                {active.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-0">
                    <div className="relative px-4 py-3 flex flex-col">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          c.bg,
                          c.text,
                        )}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm font-medium text-foreground mt-2 max-w-[140px]">
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[140px]">
                        {step.detail}
                      </p>
                    </div>
                    {i < active.steps.length - 1 && (
                      <div className="hidden sm:flex items-center mt-3.5 shrink-0">
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground/50"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 4: Tool Impact Grid ───────────────────────────────── */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.tools.map((tool) => (
                <div
                  key={tool.slug}
                  className="rounded-xl border border-border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <DynamicIcon
                      name={tool.icon}
                      size={18}
                      className={c.text}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {tool.name}
                    </span>
                    {tool.isFree && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
                        Free · 0 credits
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tool.what}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
                    <Zap size={12} className="shrink-0" />
                    {tool.stat}
                  </div>
                </div>
              ))}
            </div>

            {/* ── SECTION 5: Stats Row ──────────────────────────────────────── */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {active.stats.map((stat, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-4 text-center space-y-1",
                    c.border,
                    c.bg,
                  )}
                >
                  <p className="text-xs text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                  <p className="text-sm line-through text-muted-foreground/60 mt-1">
                    {stat.before}
                  </p>
                  <p className={cn("text-xl font-bold mt-0.5", c.text)}>
                    {stat.after}
                  </p>
                </div>
              ))}
            </div>

            {/* ── SECTION 6: CTA Block ──────────────────────────────────────── */}
            <div className="mt-8 text-center space-y-3">
              <button
                onClick={() => openAuthModal("signup")}
                className="inline-block px-8 py-3 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {active.ctaText}
              </button>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                {active.id === "sme" && (
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                )}
                {active.ctaNote}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
