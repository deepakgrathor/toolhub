'use client'

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePresetStore } from "@/store/preset-store";

export function usePresets(toolSlug: string) {
  const { data: session } = useSession();
  const store = usePresetStore();

  const fetchPresets = useCallback(async () => {
    if (!session?.user) return;
    if (store.isFetched(toolSlug)) return;

    store.setLoading(toolSlug, true);

    try {
      const res = await fetch(
        `/api/tools/presets?toolSlug=${encodeURIComponent(toolSlug)}`
      );

      if (res.status === 403) {
        store.setPresets(toolSlug, []);
        store.markFetched(toolSlug);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch presets");

      const { presets } = await res.json() as { presets: Parameters<typeof store.setPresets>[1] };
      store.setPresets(toolSlug, presets);
      store.markFetched(toolSlug);
    } catch (err) {
      console.error("[usePresets] fetchPresets error:", err);
      store.setPresets(toolSlug, []);
      store.markFetched(toolSlug);
    } finally {
      store.setLoading(toolSlug, false);
    }
  }, [toolSlug, session, store]);

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

      const data = await res.json() as { preset?: Parameters<typeof store.addPreset>[0]; message?: string; error?: string };

      if (!res.ok) {
        return { success: false, error: data.message || data.error || "Failed to save preset" };
      }

      if (data.preset) store.addPreset(data.preset);
      return { success: true };
    } catch {
      return { success: false, error: "Failed to save preset" };
    }
  }, [toolSlug, store]);

  const deletePreset = useCallback(async (
    presetId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/tools/presets/${presetId}`, { method: "DELETE" });

      if (res.ok) {
        store.removePreset(presetId, toolSlug);
        return { success: true };
      }

      const data = await res.json() as { error?: string };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Failed to delete preset" };
    }
  }, [toolSlug, store]);

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
        if (isDefault) store.clearDefaultsForTool(toolSlug);
        store.updatePreset(presetId, { isDefault });
        return { success: true };
      }

      const data = await res.json() as { error?: string };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Failed to update preset" };
    }
  }, [toolSlug, store]);

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
        store.updatePreset(presetId, { name });
        return { success: true };
      }

      const data = await res.json() as { error?: string };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Failed to update preset" };
    }
  }, [toolSlug, store]);

  return {
    presets:          store.getPresets(toolSlug),
    defaultPreset:    store.getDefaultPreset(toolSlug),
    loading:          store.loading[toolSlug] || false,
    isFetched:        store.isFetched(toolSlug),
    fetchPresets,
    savePreset,
    deletePreset,
    setDefaultPreset,
    updatePresetName,
  };
}
