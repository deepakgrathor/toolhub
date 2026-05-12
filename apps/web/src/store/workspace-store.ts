"use client";

import { create } from "zustand";

export interface WorkspaceTool {
  slug: string;
  name: string;
}

interface WorkspaceStore {
  kitName: string;
  professions: string[];
  kitTools: WorkspaceTool[];
  addedTools: WorkspaceTool[];
  initialized: boolean;
  setWorkspace: (data: {
    kitName: string;
    professions: string[];
    kitTools: WorkspaceTool[];
    addedTools: WorkspaceTool[];
  }) => void;
  addTool: (tool: WorkspaceTool) => void;
  removeTool: (slug: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  kitName: "",
  professions: [],
  kitTools: [],
  addedTools: [],
  initialized: false,

  setWorkspace: (data) => set({ ...data, initialized: true }),

  addTool: (tool) =>
    set((s) => {
      const alreadyInKit = s.kitTools.some((t) => t.slug === tool.slug);
      const alreadyAdded = s.addedTools.some((t) => t.slug === tool.slug);
      if (alreadyInKit || alreadyAdded) return s;
      return { addedTools: [...s.addedTools, tool] };
    }),

  removeTool: (slug) =>
    set((s) => ({ addedTools: s.addedTools.filter((t) => t.slug !== slug) })),
}));
