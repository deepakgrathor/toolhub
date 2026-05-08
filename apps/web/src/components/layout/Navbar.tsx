"use client";

import { useSession } from "next-auth/react";
import { Menu, Search, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useSearchStore } from "@/store/search-store";
import { useCreditStore } from "@/store/credits-store";

export function Navbar() {
  const { data: session, status } = useSession();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const toggleMobile = useSidebarStore((s) => s.toggleMobile);
  const openSearch = useSearchStore((s) => s.setOpen);
  const balance = useCreditStore((s) => s.balance);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobile}
        className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search trigger */}
      <button
        onClick={() => openSearch(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-surface",
          "px-3 py-1.5 text-sm text-muted-foreground",
          "hover:border-accent/40 hover:text-foreground transition-colors",
          "flex-1 max-w-xs md:max-w-sm"
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search tools...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-xs font-mono opacity-60">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {status === "loading" && (
          <div className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />
        )}

        {status === "unauthenticated" && (
          <button
            onClick={() => openAuthModal("login")}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Login
          </button>
        )}

        {status === "authenticated" && session?.user && (
          <div className="flex items-center gap-3">
            {/* Credits badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1">
              <Coins className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent">
                {balance} credits
              </span>
            </div>

            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 overflow-hidden shrink-0">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-accent uppercase">
                  {session.user.name?.[0] ?? "U"}
                </span>
              )}
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground max-w-[120px] truncate">
              {session.user.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
