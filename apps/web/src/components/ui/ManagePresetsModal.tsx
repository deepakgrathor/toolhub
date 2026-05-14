'use client'

import { useState } from 'react'
import { X, BookOpen, Download, Star, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Preset } from '@/store/preset-store'

interface ManagePresetsModalProps {
  isOpen: boolean
  onClose: () => void
  presets: Preset[]
  toolSlug: string
  planSlug: string
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
  onSetDefault: (id: string, isDefault: boolean) => Promise<{ success: boolean; error?: string }>
  onLoad: (inputs: Record<string, string>) => void
}

export function ManagePresetsModal({
  isOpen,
  onClose,
  presets,
  planSlug,
  onDelete,
  onSetDefault,
  onLoad,
}: ManagePresetsModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleDelete(presetId: string) {
    setDeletingId(presetId)
    const result = await onDelete(presetId)
    if (!result.success) {
      toast.error(result.error || 'Failed to delete preset')
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  async function handleToggleDefault(preset: Preset) {
    setTogglingId(preset._id)
    const newDefault = !preset.isDefault
    const result = await onSetDefault(preset._id, newDefault)
    if (!result.success) {
      toast.error(result.error || 'Failed to update preset')
    } else {
      toast.success(newDefault ? 'Set as default' : 'Default removed')
    }
    setTogglingId(null)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">My Presets</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-header */}
        <div className="px-5 py-2 border-b border-border flex-shrink-0">
          <p className="text-sm text-muted-foreground">
            {presets.length} saved preset{presets.length !== 1 ? 's' : ''} for this tool
            {planSlug === 'pro' && ` (${presets.length}/5)`}
          </p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {presets.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-medium text-foreground">No presets saved yet</p>
              <p className="text-sm text-muted-foreground">
                Fill the form and click &quot;Save as Preset&quot; to save your inputs.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map(preset => {
                const filledEntries = Object.entries(preset.inputs).filter(
                  ([, v]) => v?.toString().trim()
                )
                return (
                  <div
                    key={preset._id}
                    className={cn(
                      'rounded-lg border p-3 space-y-2 transition-colors',
                      preset.isDefault
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    )}
                  >
                    {/* Row 1 — Name + Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm text-foreground truncate">
                          {preset.name}
                        </span>
                        {preset.isDefault && (
                          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                            default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(preset.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    {/* Row 2 — Input preview */}
                    {filledEntries.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {filledEntries.slice(0, 3).map(([key, value]) => (
                          <span key={key} className="text-xs text-muted-foreground">
                            <span className="capitalize">{key}</span>:&nbsp;
                            <span className="text-foreground">
                              {value.toString().slice(0, 25)}
                              {value.toString().length > 25 ? '…' : ''}
                            </span>
                          </span>
                        ))}
                        {filledEntries.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{filledEntries.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Row 3 — Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* Load */}
                      <button
                        onClick={() => {
                          onLoad(preset.inputs)
                          onClose()
                          toast.success(`Preset "${preset.name}" loaded`)
                        }}
                        className="flex items-center gap-1 h-7 px-2 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors text-foreground"
                      >
                        <Download className="h-3 w-3" />
                        Load
                      </button>

                      {/* Default toggle */}
                      <button
                        onClick={() => handleToggleDefault(preset)}
                        disabled={togglingId === preset._id}
                        title={preset.isDefault ? 'Remove as default' : 'Set as default (auto-loads on tool open)'}
                        className={cn(
                          'flex items-center gap-1 h-7 px-2 text-xs rounded-md transition-colors',
                          'hover:bg-muted disabled:opacity-50',
                          preset.isDefault
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {togglingId === preset._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Star
                            className="h-3 w-3"
                            fill={preset.isDefault ? 'currentColor' : 'none'}
                          />
                        )}
                        {preset.isDefault ? 'Default' : 'Set default'}
                      </button>

                      {/* Delete */}
                      <div className="ml-auto">
                        {confirmDeleteId === preset._id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Sure?</span>
                            <button
                              onClick={() => handleDelete(preset._id)}
                              disabled={deletingId === preset._id}
                              className="flex items-center h-7 px-2 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {deletingId === preset._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Yes, delete'
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-7 px-2 text-xs rounded-md hover:bg-muted transition-colors text-muted-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(preset._id)}
                            className="flex items-center gap-1 h-7 px-2 text-xs rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-5 py-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
