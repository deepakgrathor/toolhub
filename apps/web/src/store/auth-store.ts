"use client";

import { create } from "zustand";

type AuthMode = "login" | "signup";

interface AuthStore {
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: AuthMode) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthModalOpen: false,
  authMode: "login",
  openAuthModal: (mode = "login") =>
    set({ isAuthModalOpen: true, authMode: mode }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthMode: (mode) => set({ authMode: mode }),
}));
