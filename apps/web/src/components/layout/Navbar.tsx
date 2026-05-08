"use client";

import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground tracking-tight">
          Toolspire
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {status === "loading" && (
          <div className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />
        )}

        {status === "unauthenticated" && (
          <button
            onClick={() => openAuthModal("login")}
            className={cn(
              "rounded-lg bg-[#7c3aed] px-4 py-1.5 text-sm font-medium text-white",
              "hover:opacity-90 transition-opacity"
            )}
          >
            Login
          </button>
        )}

        {status === "authenticated" && session?.user && (
          <div className="flex items-center gap-3">
            {/* Credits badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-[#7c3aed]/15 px-3 py-1">
              <Coins className="h-3.5 w-3.5 text-[#7c3aed]" />
              <span className="text-xs font-semibold text-[#7c3aed]">
                {session.user.credits ?? 0} credits
              </span>
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed]/20 overflow-hidden">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-[#7c3aed] uppercase">
                    {session.user.name?.[0] ?? "U"}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                {session.user.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
