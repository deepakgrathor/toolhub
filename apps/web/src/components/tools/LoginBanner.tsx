"use client";

import { useSession } from "next-auth/react";
import { LogIn } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function LoginBanner() {
  const { status } = useSession();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  if (status !== "unauthenticated") return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3">
      <LogIn className="h-4 w-4 text-accent shrink-0" />
      <div className="flex-1 text-sm">
        <span className="text-foreground font-medium">Login to use this tool.</span>{" "}
        <span className="text-muted-foreground">Get 10 free credits on signup.</span>
      </div>
      <button
        onClick={() => openAuthModal("login")}
        className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white hover:opacity-90 transition-opacity shrink-0"
      >
        Sign in
      </button>
    </div>
  );
}
