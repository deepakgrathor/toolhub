"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Menu, Search, Coins, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useSearchStore } from "@/store/search-store";
import { useCreditStore } from "@/store/credits-store";
import { UserDropdown } from "./UserDropdown";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark"
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  );
}

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
        className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
          "hover:border-primary/40 hover:text-foreground transition-colors",
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
      <div className="flex items-center gap-2 ml-auto">
        {status === "loading" && (
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted/50" />
        )}

        {status === "unauthenticated" && (
          <>
            <ThemeToggle />
            <button
              onClick={() => openAuthModal("login")}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Login
            </button>
          </>
        )}

        {status === "authenticated" && session?.user && (
          <>
            {/* Credits badge */}
            <Link
              href="/pricing"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 hover:bg-primary/25 transition-colors"
              title="Buy more credits"
            >
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {balance}
              </span>
            </Link>

            <ThemeToggle />

            <UserDropdown
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
          </>
        )}
      </div>
    </header>
  );
}
