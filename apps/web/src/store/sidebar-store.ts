"use client";

import { create } from "zustand";

interface SidebarStore {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () =>
    set((s) => {
      const next = !s.isCollapsed;
      if (typeof window !== "undefined")
        localStorage.setItem("sidebar-collapsed", String(next));
      return { isCollapsed: next };
    }),
  toggleMobile: () => set((s) => ({ isMobileOpen: !s.isMobileOpen })),
  closeMobile: () => set({ isMobileOpen: false }),
}));
