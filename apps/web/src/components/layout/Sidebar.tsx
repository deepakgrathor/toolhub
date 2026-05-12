"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronLeft, ChevronRight,
  LayoutDashboard, Gift, LogOut, X, Coins, Compass,
  Sparkles, Plus,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useCreditStore } from "@/store/credits-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { getToolIcon } from "@/lib/tool-icons";

// ── Workspace initialiser (loads once per session) ────────────────────────────

function useWorkspaceInit() {
  const { data: session } = useSession();
  const { initialized, setWorkspace } = useWorkspaceStore();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/workspace");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.kitTools) {
        setWorkspace({
          kitName:    data.kitName   ?? "My Workspace",
          professions: data.professions ?? [],
          kitTools:  data.kitTools  ?? [],
          addedTools: data.addedTools ?? [],
        });
      }
    } catch {
      // silent
    }
  }, [setWorkspace]);

  useEffect(() => {
    if (session?.user && !initialized) load();
  }, [session?.user, initialized, load]);
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

// ── Tool link (shared for kit tools and added tools) ──────────────────────────

function ToolLink({
  slug,
  name,
  activeSlug,
  isCollapsed,
}: {
  slug: string;
  name: string;
  activeSlug: string | null;
  isCollapsed: boolean;
}) {
  const Icon = getToolIcon(slug);
  const isActive = slug === activeSlug;

  return (
    <Link
      href={`/tools/${slug}`}
      title={isCollapsed ? name : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-md py-1.5 text-sm transition-colors",
        isCollapsed ? "justify-center px-2" : "pl-6 pr-3 border-l-2 ml-3",
        isActive
          ? "text-primary font-medium border-l-primary bg-primary/5"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/5 border-l-accent/20"
      )}
    >
      {isActive && !isCollapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
      )}
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {!isCollapsed && <span className="truncate">{name}</span>}
    </Link>
  );
}

// ── Section header (kit or added-tools block) ─────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  variant = "kit",
}: {
  icon: React.ElementType;
  label: string;
  variant?: "kit" | "added";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 mb-1",
        variant === "kit"
          ? "bg-accent/5 border border-accent/20"
          : "bg-muted/50 border border-border"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="flex-1 truncate text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}

// ── Sidebar content (shared between desktop + mobile) ─────────────────────────

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
  const { kitName, kitTools, addedTools, initialized } = useWorkspaceStore();

  useWorkspaceInit();

  const activeSlug = pathname.startsWith("/tools/")
    ? pathname.split("/tools/")[1]?.split("/")[0] ?? null
    : null;

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

      {/* Explore link */}
      <div className="px-2 pb-2 shrink-0">
        <Link
          href="/explore"
          title={isCollapsed ? "Explore Tools" : undefined}
          className={cn(
            "sidebar-link flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === "/explore"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <Compass className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && <span>Explore Tools</span>}
        </Link>
      </div>

      <div className="border-t border-border/50 shrink-0" />

      {/* Kit + Added Tools navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {initialized && kitTools.length > 0 && (
          <>
            {/* ── Kit section label ── */}
            {!isCollapsed && (
              <p className="px-1 pb-1 text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
                My Kit
              </p>
            )}

            {/* Kit header card */}
            {!isCollapsed && (
              <SectionHeader icon={Sparkles} label={kitName} variant="kit" />
            )}

            {/* Kit tools (indented) */}
            {kitTools.map((tool) => (
              <ToolLink
                key={tool.slug}
                slug={tool.slug}
                name={tool.name}
                activeSlug={activeSlug}
                isCollapsed={isCollapsed}
              />
            ))}

            {/* ── Added tools section ── */}
            {addedTools.length > 0 && (
              <>
                <div className="pt-3" />
                {!isCollapsed && (
                  <p className="px-1 pb-1 text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
                    My Tools
                  </p>
                )}
                {!isCollapsed && (
                  <SectionHeader icon={Plus} label="My Added Tools" variant="added" />
                )}
                {addedTools.map((tool) => (
                  <ToolLink
                    key={tool.slug}
                    slug={tool.slug}
                    name={tool.name}
                    activeSlug={activeSlug}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* Skeleton while loading */}
        {!initialized && !isCollapsed && (
          <div className="space-y-2 px-1 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-7 rounded-md bg-muted/40 animate-pulse" />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      {session?.user && (
        <div className="border-t border-border px-2 py-3 space-y-0.5 shrink-0">
          <CreditsWidget isCollapsed={isCollapsed} />

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
