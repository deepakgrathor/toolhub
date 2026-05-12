"use client";

import { useAuthStore } from "@/store/auth-store";

export default function KitCTAButtons() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <button
        onClick={() => openAuthModal("signup")}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Try Free
      </button>
      <a
        href="/pricing"
        className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        View Pricing
      </a>
    </div>
  );
}
