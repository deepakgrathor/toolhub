"use client";

import { create } from "zustand";

interface CreditsStore {
  balance: number;
  isLoading: boolean;
  lastSynced: Date | null;
  setBalance: (n: number) => void;
  deductLocally: (n: number) => void;
  syncFromServer: () => Promise<void>;
}

export const useCreditStore = create<CreditsStore>((set) => ({
  balance: 0,
  isLoading: false,
  lastSynced: null,

  setBalance: (n) => set({ balance: n }),

  deductLocally: (n) => set((s) => ({ balance: Math.max(0, s.balance - n) })),

  syncFromServer: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        set({ balance: data.balance, lastSynced: new Date() });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
