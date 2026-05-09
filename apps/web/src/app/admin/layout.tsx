"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wrench, Users, CreditCard, Settings,
  ArrowLeft, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tools", label: "Tools", icon: Wrench, exact: false },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/pricing", label: "Pricing", icon: CreditCard, exact: false },
  { href: "/admin/audit", label: "Audit Log", icon: ClipboardList, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Admin sidebar */}
      <aside className="w-[200px] shrink-0 border-r border-border flex flex-col bg-card">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
            <rect x="4" y="4" width="18" height="8" rx="3" fill="#7c3aed" />
            <rect x="10" y="12" width="18" height="8" rx="3" fill="#7c3aed" opacity="0.7" />
            <rect x="4" y="20" width="18" height="8" rx="3" fill="#7c3aed" />
          </svg>
          <span className="text-sm font-bold">
            <span className="text-foreground">Setu</span><span className="text-[#7c3aed]">Lix</span>
          </span>
          <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 border border-border rounded px-1 py-0.5">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-l-2 border-[#7c3aed] bg-[#7c3aed]/15 text-[#7c3aed] font-medium pl-[10px]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Back to site */}
        <div className="border-t border-border p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
