'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, Save, Settings, BookOpen, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { usePresets } from '@/hooks/usePresets'
import { SavePresetModal } from './SavePresetModal'
import { ManagePresetsModal } from './ManagePresetsModal'

interface PresetSelectorProps {
  toolSlug: string
  currentInputs: Record<string, string>
  onPresetLoad: (inputs: Record<string, string>) => void
  planSlug: string
}

export function PresetSelector({
  toolSlug,
  currentInputs,
  onPresetLoad,
  planSlug,
}: PresetSelectorProps) {
  const {
    presets,
    defaultPreset,
    loading,
    isFetched,
    fetchPresets,
    savePreset,
    deletePreset,
    setDefaultPreset,
  } = usePresets(toolSlug)

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // FREE / LITE — locked state
  if (planSlug === 'free' || planSlug === 'lite') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-1.5 bg-muted/30">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Presets available on PRO</span>
          <a
            href="/pricing"
            className="text-primary hover:underline font-medium ml-0.5"
          >
            Upgrade →
          </a>
        </div>
      </div>
    )
  }

  // PRO+ state
  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Preset dropdown — only if presets exist */}
      {presets.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 text-xs',
              'rounded-lg border border-border bg-background',
              'hover:bg-muted transition-colors text-foreground'
            )}
          >
            <BookOpen className="h-3 w-3 text-muted-foreground" />
            <span>Load preset</span>
            {defaultPreset && (
              <span className="text-primary font-medium truncate max-w-24">
                · {defaultPreset.name}
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-3 w-3 text-muted-foreground transition-transform',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {dropdownOpen && (
            <div
              className={cn(
                'absolute top-full mt-1 left-0 z-50',
                'w-56 rounded-xl border border-border',
                'bg-card shadow-lg py-1 overflow-hidden'
              )}
            >
              {presets.map(preset => {
                const firstEntry = Object.entries(preset.inputs).find(
                  ([, v]) => v?.toString().trim()
                )
                return (
                  <button
                    key={preset._id}
                    onClick={() => {
                      onPresetLoad(preset.inputs)
                      setDropdownOpen(false)
                      toast.success(`Loaded "${preset.name}"`)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {preset.name}
                      </p>
                      {firstEntry && (
                        <p className="text-xs text-muted-foreground truncate">
                          {firstEntry[1].toString().slice(0, 30)}
                        </p>
                      )}
                    </div>
                    {preset.isDefault && (
                      <span className="text-xs text-primary shrink-0">default</span>
                    )}
                  </button>
                )
              })}

              {/* Manage option */}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    setShowManageModal(true)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Settings className="h-3 w-3" />
                  Manage presets
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save as Preset button */}
      <button
        onClick={() => setShowSaveModal(true)}
        disabled={loading && !isFetched}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 text-xs',
          'rounded-lg border border-border bg-background',
          'hover:bg-muted transition-colors text-foreground',
          'disabled:opacity-50'
        )}
      >
        {loading && !isFetched ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Save className="h-3 w-3" />
        )}
        <span>Save as Preset</span>
        {planSlug === 'pro' && isFetched && (
          <span
            className={cn(
              'ml-0.5 text-xs',
              presets.length >= 5 ? 'text-red-500' : 'text-muted-foreground'
            )}
          >
            {presets.length}/5
          </span>
        )}
      </button>

      {/* Manage button — settings icon (only if presets exist) */}
      {presets.length > 0 && (
        <button
          onClick={() => setShowManageModal(true)}
          className="flex items-center gap-1.5 h-8 px-2 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="Manage saved presets"
        >
          <Settings className="h-3 w-3" />
        </button>
      )}

      {/* Modals */}
      <SavePresetModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={savePreset}
        currentInputs={currentInputs}
        planSlug={planSlug}
        presetCount={presets.length}
      />

      <ManagePresetsModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        presets={presets}
        toolSlug={toolSlug}
        planSlug={planSlug}
        onDelete={deletePreset}
        onSetDefault={setDefaultPreset}
        onLoad={inputs => {
          onPresetLoad(inputs)
          toast.success('Preset loaded!')
        }}
      />
    </div>
  )
}
