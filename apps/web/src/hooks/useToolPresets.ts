'use client'

import { useEffect, useRef } from 'react'
import { usePresets } from './usePresets'

interface UseToolPresetsOptions {
  toolSlug: string
  onDefaultLoad?: (inputs: Record<string, string>) => void
}

export function useToolPresets({ toolSlug, onDefaultLoad }: UseToolPresetsOptions) {
  const defaultLoadedRef = useRef(false)
  const hookResult = usePresets(toolSlug)
  const { presets, isFetched, fetchPresets } = hookResult

  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  useEffect(() => {
    if (!isFetched || defaultLoadedRef.current || !onDefaultLoad) return
    const defaultPreset = presets.find(p => p.isDefault)
    if (defaultPreset) {
      onDefaultLoad(defaultPreset.inputs)
      defaultLoadedRef.current = true
    }
  }, [isFetched, presets, onDefaultLoad])

  return hookResult
}
