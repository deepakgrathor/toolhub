"use client";

import { create } from "zustand";

export interface SearchTool {
  slug: string;
  name: string;
  kits: string[];
  icon: string;
  isFree: boolean;
  config: { creditCost: number };
}

interface SearchStore {
  isOpen: boolean;
  tools: SearchTool[];
  setOpen: (v: boolean) => void;
  setTools: (tools: SearchTool[]) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  isOpen: false,
  tools: [],
  setOpen: (v) => set({ isOpen: v }),
  setTools: (tools) => set({ tools }),
}));
