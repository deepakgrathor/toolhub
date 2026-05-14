"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLS, CATEGORIES } from "@/data/tools-data";

export default function MarketingToolsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = TOOLS.filter((t) => {
    const catMatch = activeCategory === "all" || t.category === activeCategory;
    const searchMatch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.outcome.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="min-h-screen px-4 py-16 max-w-7xl mx-auto">

      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          27 Tools · 5 Kits
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          AI Tools for Every Indian Professional
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Creator to CA — 27 tools, 5 kits, one platform. Browse and explore free.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Kit filter tabs — centered, wrapping */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIES.map(({ id, label, count, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeCategory === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(({ slug, name, Icon, outcome, isFree }) => (
          <button
            key={slug}
            onClick={() => router.push(`/tools/${slug}`)}
            className="group rounded-xl border border-border bg-card p-4
              hover:border-primary/40 hover:-translate-y-0.5
              hover:shadow-md hover:shadow-primary/5
              transition-all duration-200 text-left"
          >
            {/* Icon */}
            <div className="w-9 h-9 rounded-lg bg-primary/10
              flex items-center justify-center mb-3
              group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-primary" />
            </div>

            {/* Name */}
            <div className="text-sm font-semibold text-foreground leading-tight mb-1">
              {name}
            </div>

            {/* Outcome */}
            <div className="text-xs text-muted-foreground leading-relaxed">
              {outcome}
            </div>

            {/* Badge */}
            <div className="mt-3">
              {isFree ? (
                <span className="inline-flex items-center
                  text-[10px] font-medium px-1.5 py-0.5
                  rounded-full bg-emerald-500/10
                  text-emerald-600 dark:text-emerald-400">
                  Free
                </span>
              ) : (
                <span className="inline-flex items-center gap-1
                  text-[10px] text-primary/60">
                  <Sparkles className="h-3 w-3" />
                  AI Tool
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground mt-12">
          No tools found. Try a different search or category.
        </p>
      )}

      {/* CTA */}
      <div className="mt-16 text-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 shadow-2xl shadow-primary/20">
        <h2 className="text-2xl font-bold text-white mb-2">Try all 27 tools free</h2>
        <p className="text-primary-foreground/80 mb-6">
          Sign up and get 10 free credits instantly. No card needed.
        </p>
        <Link
          href="/?auth=signup"
          className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary hover:opacity-90 transition-opacity"
        >
          Start Free — No Card Needed
        </Link>
      </div>
    </div>
  );
}
