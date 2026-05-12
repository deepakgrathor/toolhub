"use client";

import { create } from "zustand";

interface CreditsStore {
  balance: number;
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  setBalance: (n: number) => void;
  deductLocally: (n: number) => void;
  syncFromServer: () => Promise<void>;
}

export const useCreditStore = create<CreditsStore>((set, get) => ({
  balance: 0,
  isLoading: false,
  isSyncing: false,
  lastSynced: null,

  setBalance: (n) => set({ balance: n }),

  deductLocally: (n) => set((s) => ({ balance: Math.max(0, s.balance - n) })),

  syncFromServer: async () => {
    // Guard: prevent concurrent sync calls (StrictMode double-invoke, Suspense, etc.)
    if (get().isSyncing) return;
    set({ isSyncing: true, isLoading: true });
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balance === "number") {
          set({ balance: data.balance, lastSynced: new Date() });
        }
      }
    } catch (e) {
      console.error("credit sync failed:", e);
    } finally {
      set({ isSyncing: false, isLoading: false });
    }
  },
}));
