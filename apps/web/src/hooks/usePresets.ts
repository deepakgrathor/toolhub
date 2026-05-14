'use client'

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePresetStore, type Preset } from "@/store/preset-store";

export function usePresets(toolSlug: string) {
  const { data: session } = useSession();

  // Granular selectors — only re-render when these specific slices change
  const presets      = usePresetStore(s => s.presets[toolSlug] ?? []);
  const loading      = usePresetStore(s => s.loading[toolSlug] ?? false);
  const isFetched    = usePresetStore(s => s.fetchedTools.includes(toolSlug));
  const defaultPreset = usePresetStore(
    s => (s.presets[toolSlug] ?? []).find(p => p.isDefault) ?? null
  );

  // ------------------------------------------------------------------
  // All mutating callbacks read/write store via getState() so they
  // never end up in useCallback deps — eliminating the infinite loop
  // caused by store object reference changing on every state update.
  // ------------------------------------------------------------------

  const fetchPresets = useCallback(async () => {
    if (!session?.user) return;
    const { isFetched: checkFetched, setLoading, setPresets, markFetched } =
      usePresetStore.getState();
    if (checkFetched(toolSlug)) return;

    setLoading(toolSlug, true);
    try {
      const res = await fetch(
        `/api/tools/presets?toolSlug=${encodeURIComponent(toolSlug)}`
      );
      if (res.status === 403) {
        // Free/Lite user — not an error, just no presets available
        setPresets(toolSlug, []);
        markFetched(toolSlug);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch presets");
      const data = await res.json() as { presets: Preset[] };
      setPresets(toolSlug, data.presets);
      markFetched(toolSlug);
    } catch (err) {
      console.error("[usePresets] fetchPresets error:", err);
      setPresets(toolSlug, []);
      markFetched(toolSlug);
    } finally {
      usePresetStore.getState().setLoading(toolSlug, false);
    }
  }, [toolSlug, session]);

  const savePreset = useCallback(async (
    name: string,
    inputs: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/tools/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, name, inputs }),
      });
      const data = await res.json() as {
        preset?: Preset;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        return { success: false, error: data.message ?? data.error ?? "Failed to save preset" };
      }
      if (data.preset) usePresetStore.getState().addPreset(data.preset);
      return { success: true };
    } catch {
      return { success: false, error: "Failed to save preset" };
    }
  }, [toolSlug]);

  const deletePreset = useCallback(async (
    presetId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/tools/presets/${presetId}`, { method: "DELETE" });
      if (res.ok) {
        usePresetStore.getState().removePreset(presetId, toolSlug);
        return { success: true };
      }
      const data = await res.json() as { error?: string };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Failed to delete preset" };
    }
  }, [toolSlug]);

  const setDefaultPreset = useCallback(async (
    presetId: string,
    isDefault: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/tools/presets/${presetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault }),
      });
      if (res.ok) {
        const state = usePresetStore.getState();
        if (isDefault) state.clearDefaultsForTool(toolSlug);
        state.updatePreset(presetId, { isDefault });
        return { success: true };
      }
      const data = await res.json() as { error?: string };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Failed to update preset" };
    }
  }, [toolSlug]);

  const updatePresetName = useCallback(async (
    presetId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/tools/presets/${presetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        usePresetStore.getState().updatePreset(presetId, { name });
        return { success: true };
      }
      const data = await res.json() as { error?: string };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Failed to update preset name" };
    }
  }, []);

  return {
    presets,
    defaultPreset,
    loading,
    isFetched,
    fetchPresets,
    savePreset,
    deletePreset,
    setDefaultPreset,
    updatePresetName,
  };
}
