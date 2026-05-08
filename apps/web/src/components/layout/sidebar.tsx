"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  ChevronLeft, ChevronRight, Coins, ShoppingBag, Sun, Moon, X, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useAuthStore } from "@/store/auth-store";
import { getKitIcon } from "@/lib/tool-icons";

const KITS = [
  { kit: "all",       label: "All Tools" },
  { kit: "creator",   label: "Creator Kit" },
  { kit: "sme",       label: "SME Kit" },
  { kit: "hr",        label: "HR Kit" },
  { kit: "ca-legal",  label: "CA / Legal Kit" },
  { kit: "marketing", label: "Marketing Kit" },
];

type KitCount = { kit: string; toolCount: number };

function KitNav({ isCollapsed, kits }: { isCollapsed: boolean; kits: KitCount[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const rawKit = searchParams.get("kit");
  const activeKit = pathname.startsWith("/tools") ? (rawKit ?? "all") : null;

  const getCount = (kit: string) => {
    if (kit === "all") return kits.reduce((s, k) => s + k.toolCount, 0);
    return kits.find((k) => k.kit === kit)?.toolCount ?? 0;
  };

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
      {KITS.map(({ kit, label }) => {
        const href = kit === "all" ? "/tools" : `/tools?kit=${kit}`;
        const isActive = activeKit === kit;
        const count = getCount(kit);
        const KitIcon = getKitIcon(kit);
        return (
          <Link key={kit} href={href} title={isCollapsed ? label : undefined}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <KitIcon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-accent/20 text-accent"
                          : "bg-white/10 text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  isCollapsed = false,
  onClose,
  kits,
}: {
  isCollapsed?: boolean;
  onClose?: () => void;
  kits: KitCount[];
}) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-3 shrink-0">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 flex-1">
            <Zap className="h-5 w-5 text-accent shrink-0" />
            <span className="font-bold text-foreground tracking-tight">
              Tool<span className="text-accent">spire</span>
            </span>
          </Link>
        )}
        {isCollapsed && <Zap className="mx-auto h-5 w-5 text-accent" />}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Kit navigation */}
      <Suspense fallback={<div className="flex-1" />}>
        <KitNav isCollapsed={isCollapsed} kits={kits} />
      </Suspense>

      {/* Bottom section */}
      <div className="border-t border-border px-2 py-3 space-y-1.5 shrink-0">
        {session?.user ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 bg-accent/10 text-accent text-sm font-medium",
              isCollapsed && "justify-center"
            )}
          >
            <Coins className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{session.user.credits ?? 0} credits</span>}
          </div>
        ) : (
          !isCollapsed && (
            <button
              onClick={() => openAuthModal("login")}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-left"
            >
              Sign in for credits
            </button>
          )
        )}

        {!isCollapsed && (
          <Link
            href="/pricing"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Buy Credits
          </Link>
        )}

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors",
            isCollapsed ? "w-full justify-center" : "w-full"
          )}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!isCollapsed && <span>Toggle theme</span>}
        </button>
      </div>
    </>
  );
}

function DesktopSidebar({ kits }: { kits: KitCount[] }) {
  const { isCollapsed, toggle } = useSidebarStore();

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") useSidebarStore.setState({ isCollapsed: true });
  }, []);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen flex-col border-r border-border bg-surface transition-[width] duration-200 shrink-0 relative",
        isCollapsed ? "w-14" : "w-60"
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} kits={kits} />
      <button
        onClick={toggle}
        className="absolute -right-3 top-[58px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}

function MobileDrawer({ kits }: { kits: KitCount[] }) {
  const { isMobileOpen, closeMobile } = useSidebarStore();
  if (!isMobileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
      <aside className="absolute left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col">
        <SidebarContent onClose={closeMobile} kits={kits} />
      </aside>
    </div>
  );
}

export function Sidebar({ kits }: { kits: KitCount[] }) {
  return (
    <>
      <DesktopSidebar kits={kits} />
      <MobileDrawer kits={kits} />
    </>
  );
}
