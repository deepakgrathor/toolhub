"use client";

import { create } from "zustand";

interface SidebarStore {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  expandedKit: string | null;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  setExpandedKit: (kit: string | null) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  expandedKit: null,

  toggle: () =>
    set((s) => {
      const next = !s.isCollapsed;
      if (typeof window !== "undefined")
        localStorage.setItem("sidebar-collapsed", String(next));
      return { isCollapsed: next };
    }),

  toggleMobile: () => set((s) => ({ isMobileOpen: !s.isMobileOpen })),
  closeMobile: () => set({ isMobileOpen: false }),

  setExpandedKit: (kit) => set({ expandedKit: kit }),
}));
