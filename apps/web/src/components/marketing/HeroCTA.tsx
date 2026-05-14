"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { TOOLS, CATEGORIES } from "@/data/tools-data";

// ── Hero CTA (left column) ────────────────────────────────────────────────────

// export function HeroCTA() {
//   const openAuthModal = useAuthStore((s) => s.openAuthModal);

//   return (
//     <div className="flex flex-col gap-6 items-center text-center">

//       {/* Eyebrow badge with pulsing dot */}
//       <div className="inline-flex items-center gap-2
//         px-3 py-1.5 rounded-full border
//         border-primary/30 bg-primary/10 text-primary
//         text-xs font-medium">
//         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//         <Zap className="h-3.5 w-3.5" />
//         Live · 500+ professionals using SetuLix
//       </div>

//       {/* H1 */}
//       <h1 className="text-4xl md:text-6xl xl:text-7xl font-bold
//         tracking-tight leading-tight text-foreground">
//         Save 10 hours
//         <br />this week.
//         <br />
//         <span className="text-primary">Every week.</span>
//       </h1>

//       {/* Subheadline */}
//       <p className="text-lg text-muted-foreground
//         max-w-lg leading-relaxed">
//         27 AI tools built for Indian creators,
//         businesses, HR teams, and legal professionals.
//         One workspace. Start free — no card needed.
//       </p>

//       {/* CTA pair */}
//       <div className="flex flex-wrap items-center justify-center gap-3">
//         <button
//           onClick={() => openAuthModal("signup")}
//           className="relative overflow-hidden inline-flex items-center gap-2
//             px-6 py-3 rounded-xl font-semibold text-sm
//             bg-primary text-primary-foreground
//             hover:opacity-90 transition-opacity
//             after:absolute after:inset-0
//             after:bg-gradient-to-r after:from-transparent
//             after:via-white/10 after:to-transparent
//             after:translate-x-[-100%] hover:after:translate-x-[100%]
//             after:transition-transform after:duration-500"
//         >
//           Start free today
//           <ArrowRight className="h-4 w-4" />
//         </button>
//         <Link
//           href="/tools"
//           className="inline-flex items-center gap-2
//             px-6 py-3 rounded-xl font-semibold text-sm
//             border border-border text-foreground
//             hover:bg-muted/50 transition-colors"
//         >
//           Explore tools
//         </Link>
//       </div>

//       {/* Social proof strip */}
//       <div className="flex items-center justify-center gap-3 mt-2">
//         <div className="flex items-center">
//           {[
//             { init: "SP", bg: "bg-teal-500/20",   text: "text-teal-600 dark:text-teal-400"   },
//             { init: "RK", bg: "bg-violet-500/20",  text: "text-violet-600 dark:text-violet-400"},
//             { init: "AM", bg: "bg-amber-500/20",   text: "text-amber-600 dark:text-amber-400" },
//             { init: "VG", bg: "bg-blue-500/20",    text: "text-blue-600 dark:text-blue-400"   },
//             { init: "PS", bg: "bg-pink-500/20",    text: "text-pink-600 dark:text-pink-400"   },
//           ].map(({ init, bg, text }) => (
//             <div
//               key={init}
//               className={`w-7 h-7 rounded-full border-2 border-background
//                 flex items-center justify-center
//                 text-[10px] font-bold -ml-2 first:ml-0
//                 ${bg} ${text}`}
//             >
//               {init}
//             </div>
//           ))}
//         </div>
//         <p className="text-sm text-muted-foreground">
//           Joined by 500+ Indian professionals this month
//         </p>
//       </div>

//     </div>
//   );
// }
export function HeroCTA() {
    const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <div className="flex flex-col gap-6">
      {/* Eyebrow badge */}
      <div
        className="inline-flex items-center gap-2
        self-start px-3 py-1.5 rounded-full border
        border-primary/30 bg-primary/10 text-primary
        text-xs font-medium"
      >
        <Zap className="h-3.5 w-3.5" />
        Built for India · Trusted by 500+ professionals
      </div>

      {/* H1 */}
      <h1
        className="text-4xl md:text-6xl font-bold
        tracking-tight leading-tight text-foreground"
      >
        Save 10 hours
        <br />
        this week.
        <br />
        <span className="text-primary">Every week.</span>
      </h1>

      {/* Subheadline */}
      <p
        className="text-lg text-muted-foreground
        max-w-lg leading-relaxed"
      >
        27 AI tools built for Indian creators, businesses, HR teams, and legal
        professionals. One workspace. Start free — no card needed.
      </p>

      {/* CTA pair */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => openAuthModal("signup")}
          className="inline-flex items-center gap-2
            px-6 py-3 rounded-xl font-semibold text-sm
            bg-primary text-primary-foreground
            hover:opacity-90 transition-opacity"
        >
          Start free today
          <ArrowRight className="h-4 w-4" />
        </button>
        <a
          href="/tools"
          className="inline-flex items-center gap-2
            px-6 py-3 rounded-xl font-semibold text-sm
            border border-border text-foreground
            hover:bg-muted/50 transition-colors"
        >
          Explore tools
        </a>
      </div>

      {/* Social proof strip */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center">
          {["SP", "RK", "AM", "VG", "PS"].map((init) => (
            <div
              key={init}
              className="w-7 h-7 rounded-full
                bg-primary/10 border-2 border-background
                flex items-center justify-center
                text-[10px] font-bold text-primary
                -ml-2 first:ml-0"
            >
              {init}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Joined by 500+ Indian professionals
        </p>
      </div>
    </div>
  );
}

// ── Final CTA (bottom banner) ─────────────────────────────────────────────────

export function FinalCTA() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button
        onClick={() => openAuthModal("signup")}
        className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary hover:opacity-90 transition-opacity shadow-md"
      >
        Create Free Account <ArrowRight className="h-5 w-5" />
      </button>
      <Link
        href="/tools"
        className="flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
      >
        Explore Tools
      </Link>
    </div>
  );
}

// ── Tools Showcase (homepage Section 5) ───────────────────────────────────────

export function ToolsShowcaseSection() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? TOOLS
      : TOOLS.filter((t) => t.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Section header — centered */}
      <div className="text-center mx-auto mb-10">
        <span
          className="inline-block text-[10px] font-bold uppercase
          tracking-widest text-primary bg-primary/10 rounded-full
          px-3 py-1 mb-3"
        >
          27 AI tools
        </span>
        <h2
          className="text-3xl md:text-4xl font-bold
          text-foreground mb-3"
        >
          Everything you need. Nothing you don&apos;t.
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Pick a category or browse all 27 tools built for Indian professionals.
        </p>
      </div>

      {/* Category filter tabs — centered on sm+, scrollable on mobile */}
      <div
        className="flex gap-2 flex-wrap justify-center
        overflow-x-auto sm:overflow-visible pb-2 mb-8
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={
              activeCategory === cat.id
                ? "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap bg-primary text-primary-foreground"
                : "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap border border-border text-foreground hover:border-primary/40 hover:bg-muted/50 transition-colors"
            }
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Tool cards */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3
        lg:grid-cols-4 xl:grid-cols-5 gap-3"
      >
        {filtered.map(({ slug, name, Icon, outcome, isFree }) => (
          <button
            key={slug}
            onClick={() => openAuthModal("signup")}
            className="group rounded-xl border border-border
              bg-card p-4 text-left
              hover:border-primary/40 hover:-translate-y-0.5
              hover:shadow-md hover:shadow-primary/5
              transition-all duration-200"
          >
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-lg bg-primary/10
              flex items-center justify-center
              group-hover:bg-primary/20 transition-colors"
            >
              <Icon className="h-4 w-4 text-primary" />
            </div>

            {/* Name */}
            <div
              className="text-sm font-semibold
              text-foreground mt-3 leading-tight"
            >
              {name}
            </div>

            {/* Outcome */}
            <div
              className="text-xs text-muted-foreground
              mt-1 leading-relaxed"
            >
              {outcome}
            </div>

            {/* Free / AI badge */}
            <div className="mt-3">
              {isFree ? (
                <span
                  className="inline-flex items-center
                  text-[10px] font-medium px-1.5 py-0.5
                  rounded-full bg-emerald-500/10
                  text-emerald-600 dark:text-emerald-400"
                >
                  Free
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1
                  text-[10px] text-primary/50"
                >
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Below grid */}
      <div className="mt-10 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Can&apos;t find what you need? More tools coming every month.
        </p>
        <Link
          href="/tools"
          className="text-sm text-primary font-medium hover:underline"
        >
          See the full roadmap →
        </Link>
      </div>
    </div>
  );
}
