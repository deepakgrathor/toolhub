"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuthStore } from "@/store/auth-store";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Tools",    href: "/tools" },
  { label: "Pricing",  href: "/pricing" },
  { label: "About",    href: "/about" },
];

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo size="sm" href="/" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user ? (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Go to App
              </Link>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal("login")}
                  className="hidden md:inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuthModal("signup")}
                  className="hidden md:inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Get Started
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
              >
                {label}
              </Link>
            ))}
            <div className={cn("pt-2 border-t border-border flex gap-2 flex-wrap")}>
              {session?.user ? (
                <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                  Go to App
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => { openAuthModal("login"); setMobileOpen(false); }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { openAuthModal("signup"); setMobileOpen(false); }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
