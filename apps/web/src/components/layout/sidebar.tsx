"use client";

import { cn } from "@/lib/utils";

export function Sidebar() {
  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-surface",
        "w-[var(--sidebar-width)] shrink-0"
      )}
    >
      {/* Sidebar content will be built in later sessions */}
    </aside>
  );
}
