'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SavePresetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, inputs: Record<string, string>) => Promise<{ success: boolean; error?: string }>
  currentInputs: Record<string, string>
  planSlug: string
  presetCount: number
}

export function SavePresetModal({
  isOpen,
  onClose,
  onSave,
  currentInputs,
  planSlug,
  presetCount,
}: SavePresetModalProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setError(null)
      setSaving(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const isAtLimit = planSlug === 'pro' && presetCount >= 5

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a preset name')
      return
    }
    if (name.length > 50) {
      setError('Name must be under 50 characters')
      return
    }

    setSaving(true)
    setError(null)

    const result = await onSave(name.trim(), currentInputs)

    if (result.success) {
      toast.success('Preset saved!')
      onClose()
    } else {
      setError(result.error || 'Failed to save preset')
    }

    setSaving(false)
  }

  const filledKeys = Object.keys(currentInputs).filter(k =>
    currentInputs[k]?.toString().trim()
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Save as Preset</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Save current form inputs for quick reuse later.
          </p>

          {isAtLimit ? (
            <div className="py-6 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="font-medium text-foreground">Preset limit reached</p>
              <p className="text-sm text-muted-foreground">
                PRO plan allows 5 presets per tool.
                Delete an existing preset to save a new one.
              </p>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Name input */}
              <div className="space-y-1.5">
                <label htmlFor="preset-name" className="text-sm font-medium text-foreground">
                  Preset Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="preset-name"
                  type="text"
                  placeholder="e.g. My Tech Blog Style"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <div className="flex justify-between items-center">
                  {error ? (
                    <p className="text-xs text-red-500">{error}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {name.length}/50
                  </p>
                </div>
              </div>

              {/* Inputs preview */}
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Will save these inputs:
                </p>
                {filledKeys.slice(0, 4).map(key => (
                  <div key={key} className="flex gap-2 text-xs">
                    <span className="text-muted-foreground capitalize min-w-20">
                      {key}:
                    </span>
                    <span className="text-foreground truncate">
                      {currentInputs[key].toString().slice(0, 40)}
                      {currentInputs[key].toString().length > 40 ? '...' : ''}
                    </span>
                  </div>
                ))}
                {filledKeys.length > 4 && (
                  <p className="text-xs text-muted-foreground">
                    +{filledKeys.length - 4} more fields
                  </p>
                )}
                {filledKeys.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No inputs filled yet
                  </p>
                )}
              </div>

              {/* PRO slot counter */}
              {planSlug === 'pro' && (
                <p className="text-xs text-muted-foreground">
                  {5 - presetCount} preset slot{5 - presetCount !== 1 ? 's' : ''} remaining
                </p>
              )}

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Preset
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
