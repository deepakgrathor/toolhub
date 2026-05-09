"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  LayoutDashboard, Gift, LogOut, X, Coins, ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useCreditStore } from "@/store/credits-store";
import { SIDEBAR_KITS, getKitForSlug, type KitConfig } from "@/lib/kit-config";
import { getToolIcon } from "@/lib/tool-icons";

// Singleton promise so multiple sidebar instances share one fetch
let activeSlugsCache: Set<string> | null = null;
let activeSlugsExpiry = 0;

async function fetchActiveSlugs(): Promise<Set<string>> {
  if (activeSlugsCache && Date.now() < activeSlugsExpiry) return activeSlugsCache;
  try {
    const res = await fetch("/api/tools/active-slugs", { cache: "no-store" });
    const data = (await res.json()) as { slugs: string[] };
    activeSlugsCache = new Set(data.slugs);
    activeSlugsExpiry = Date.now() + 30_000; // 30 s
    return activeSlugsCache;
  } catch {
    return new Set(SIDEBAR_KITS.flatMap((k) => k.tools.map((t) => t.slug)));
  }
}

function filterKits(kits: KitConfig[], activeSlugs: Set<string>): KitConfig[] {
  return kits
    .map((kit) => ({
      ...kit,
      tools: kit.tools.filter((t) => activeSlugs.has(t.slug)),
    }))
    .filter((kit) => kit.tools.length > 0);
}

// ── Kit accordion item ────────────────────────────────────────────────────────

function KitItem({
  kit,
  isCollapsed,
  isExpanded,
  activeSlug,
  onToggle,
}: {
  kit: (typeof SIDEBAR_KITS)[0];
  isCollapsed: boolean;
  isExpanded: boolean;
  activeSlug: string | null;
  onToggle: () => void;
}) {
  const KitIcon = kit.icon;
  const isKitActive = kit.tools.some((t) => t.slug === activeSlug);

  return (
    <div>
      <div className="group/kit flex items-center">
        <button
          onClick={onToggle}
          title={isCollapsed ? kit.name : undefined}
          className={cn(
            "kit-header flex-1 min-w-0 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
            isKitActive
              ? "text-primary font-medium border-l-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
            isCollapsed && "justify-center border-l-0"
          )}
        >
          <KitIcon className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate text-left">{kit.name}</span>
              <span className="text-[10px] text-muted-foreground/60 font-normal">
                {kit.tools.length}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </>
          )}
        </button>
        {!isCollapsed && (
          <Link
            href={`/kits/${kit.pageSlug}`}
            title={`${kit.name} page`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 p-1 rounded opacity-0 group-hover/kit:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {!isCollapsed && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="tools"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pb-1 pl-3">
                {kit.tools.map((tool) => {
                  const ToolIcon = getToolIcon(tool.slug);
                  const isActive = tool.slug === activeSlug;
                  return (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className={cn(
                        "sidebar-link relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent/5 hover:text-accent"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                      )}
                      <ToolIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{tool.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Credits widget ────────────────────────────────────────────────────────────

function CreditsWidget({ isCollapsed }: { isCollapsed: boolean }) {
  const { balance, isLoading } = useCreditStore();

  if (isCollapsed) {
    return (
      <Link
        href="/pricing"
        title={`${balance} credits`}
        className="flex justify-center rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
      >
        <Coins className="h-[18px] w-[18px] shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href="/pricing"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-primary/10 transition-colors group"
      title="Buy more credits"
    >
      <Coins className="h-[18px] w-[18px] shrink-0 text-primary" />
      <span className="flex-1 text-sm text-foreground font-medium">Credits</span>
      {isLoading ? (
        <div className="h-5 w-10 animate-pulse rounded-full bg-muted/50" />
      ) : (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary group-hover:bg-primary/25 transition-colors">
          {balance}
        </span>
      )}
    </Link>
  );
}

// ── Sidebar content (shared between desktop + mobile drawer) ──────────────────

function SidebarContent({
  isCollapsed = false,
  onClose,
}: {
  isCollapsed?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { expandedKit, setExpandedKit } = useSidebarStore();
  const [visibleKits, setVisibleKits] = useState<KitConfig[]>(SIDEBAR_KITS);

  const activeSlug = pathname.startsWith("/tools/")
    ? pathname.split("/tools/")[1]?.split("/")[0] ?? null
    : null;

  // Fetch active slugs once and filter sidebar kits
  const refreshKits = useCallback(async () => {
    const slugs = await fetchActiveSlugs();
    setVisibleKits(filterKits(SIDEBAR_KITS, slugs));
  }, []);

  useEffect(() => {
    refreshKits();
  }, [refreshKits]);

  useEffect(() => {
    if (activeSlug) {
      const parentKit = getKitForSlug(activeSlug);
      if (parentKit && expandedKit !== parentKit) {
        setExpandedKit(parentKit);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  function handleKitToggle(kitId: string) {
    setExpandedKit(expandedKit === kitId ? null : kitId);
  }

  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-3 shrink-0">
        {!isCollapsed && <Logo size="sm" className="flex-1 min-w-0" />}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="18" height="8" rx="3" fill="#7c3aed" />
              <rect x="10" y="12" width="18" height="8" rx="3" fill="#7c3aed" opacity="0.7" />
              <rect x="4" y="20" width="18" height="8" rx="3" fill="#7c3aed" />
            </svg>
          </Link>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dashboard link */}
      <div className="px-2 pt-3 pb-1 shrink-0">
        <Link
          href="/dashboard"
          title={isCollapsed ? "Dashboard" : undefined}
          className={cn(
            "sidebar-link flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            isDashboard
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <LayoutDashboard className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>
      </div>

      {/* Kits label */}
      {!isCollapsed && (
        <p className="px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 shrink-0">
          Kits
        </p>
      )}

      {/* Kit navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {visibleKits.map((kit) => (
          <KitItem
            key={kit.id}
            kit={kit}
            isCollapsed={isCollapsed}
            isExpanded={expandedKit === kit.id}
            activeSlug={activeSlug}
            onToggle={() => handleKitToggle(kit.id)}
          />
        ))}
      </nav>

      {/* Bottom section */}
      {session?.user && (
        <div className="border-t border-border px-2 py-3 space-y-0.5 shrink-0">
          {/* Credits widget */}
          <CreditsWidget isCollapsed={isCollapsed} />

          {/* Refer & Earn */}
          <button
            onClick={() => {
              onClose?.();
              router.push("/dashboard#referral");
            }}
            title={isCollapsed ? "Refer & Earn" : undefined}
            className={cn(
              "sidebar-link w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <Gift className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed && <span>Refer &amp; Earn</span>}
          </button>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title={isCollapsed ? "Logout" : undefined}
            className={cn(
              "sidebar-link w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { isCollapsed, toggle } = useSidebarStore();

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") useSidebarStore.setState({ isCollapsed: true });
  }, []);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen flex-col border-r border-border bg-surface transition-[width] duration-200 shrink-0 relative",
        isCollapsed ? "w-14" : "w-[220px]"
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
      <button
        onClick={toggle}
        className="absolute -right-3 top-[58px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft  className="h-3 w-3" />
        }
      </button>
    </aside>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function MobileDrawer() {
  const { isMobileOpen, closeMobile } = useSidebarStore();
  const pathname = usePathname();

  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!isMobileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
      <aside className="absolute left-0 top-0 h-full w-[220px] bg-surface border-r border-border">
        <SidebarContent onClose={closeMobile} />
      </aside>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileDrawer />
    </>
  );
}
