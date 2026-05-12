"use client";

import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function HeroCTA() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
      <button
        onClick={() => openAuthModal("signup")}
        className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
      >
        Start Free — No Card Needed <ArrowRight className="h-5 w-5" />
      </button>
      <a
        href="/tools"
        className="flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        Explore Tools
      </a>
    </div>
  );
}

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
      <a
        href="/tools"
        className="flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
      >
        Explore Tools
      </a>
    </div>
  );
}

export function ToolCardClick({ slug, children }: { slug: string; children: React.ReactNode }) {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <button
      onClick={() => openAuthModal("signup")}
      className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-150 text-left w-full"
      data-slug={slug}
    >
      {children}
    </button>
  );
}
