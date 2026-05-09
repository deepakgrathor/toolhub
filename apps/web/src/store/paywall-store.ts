"use client";

import { create } from "zustand";

interface PaywallStore {
  isOpen: boolean;
  requiredCredits: number;
  toolName: string;
  openPaywall: (toolName: string, requiredCredits: number) => void;
  closePaywall: () => void;
}

export const usePaywallStore = create<PaywallStore>((set) => ({
  isOpen: false,
  requiredCredits: 0,
  toolName: "",
  openPaywall: (toolName, requiredCredits) =>
    set({ isOpen: true, toolName, requiredCredits }),
  closePaywall: () => set({ isOpen: false }),
}));
