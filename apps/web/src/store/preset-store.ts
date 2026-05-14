import { create } from "zustand";

export interface Preset {
  _id: string;
  toolSlug: string;
  name: string;
  inputs: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PresetStore {
  presets: Record<string, Preset[]>;
  fetchedTools: string[];
  loading: Record<string, boolean>;

  setPresets: (toolSlug: string, presets: Preset[]) => void;
  addPreset: (preset: Preset) => void;
  updatePreset: (id: string, updates: Partial<Preset>) => void;
  removePreset: (id: string, toolSlug: string) => void;
  clearDefaultsForTool: (toolSlug: string) => void;
  getPresets: (toolSlug: string) => Preset[];
  getDefaultPreset: (toolSlug: string) => Preset | null;
  isFetched: (toolSlug: string) => boolean;
  setLoading: (toolSlug: string, value: boolean) => void;
  markFetched: (toolSlug: string) => void;
}

export const usePresetStore = create<PresetStore>((set, get) => ({
  presets: {},
  fetchedTools: [],
  loading: {},

  setPresets: (toolSlug, presets) =>
    set(state => ({
      presets: { ...state.presets, [toolSlug]: presets },
    })),

  addPreset: (preset) =>
    set(state => ({
      presets: {
        ...state.presets,
        [preset.toolSlug]: [preset, ...(state.presets[preset.toolSlug] || [])],
      },
    })),

  updatePreset: (id, updates) =>
    set(state => {
      const newPresets = { ...state.presets };
      Object.keys(newPresets).forEach(slug => {
        newPresets[slug] = newPresets[slug].map(p =>
          p._id === id ? { ...p, ...updates } : p
        );
      });
      return { presets: newPresets };
    }),

  removePreset: (id, toolSlug) =>
    set(state => ({
      presets: {
        ...state.presets,
        [toolSlug]: (state.presets[toolSlug] || []).filter(p => p._id !== id),
      },
    })),

  clearDefaultsForTool: (toolSlug) =>
    set(state => ({
      presets: {
        ...state.presets,
        [toolSlug]: (state.presets[toolSlug] || []).map(p => ({ ...p, isDefault: false })),
      },
    })),

  getPresets: (toolSlug) => get().presets[toolSlug] || [],

  getDefaultPreset: (toolSlug) =>
    (get().presets[toolSlug] || []).find(p => p.isDefault) ?? null,

  isFetched: (toolSlug) => get().fetchedTools.includes(toolSlug),

  setLoading: (toolSlug, value) =>
    set(state => ({
      loading: { ...state.loading, [toolSlug]: value },
    })),

  markFetched: (toolSlug) =>
    set(state => ({
      fetchedTools: [...state.fetchedTools, toolSlug],
    })),
}));
