'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCreditStore } from '@/store/credits-store'

interface CreditHealthWidgetProps {
  planSlug: string
}

export function CreditHealthWidget({ planSlug }: CreditHealthWidgetProps) {
  const { balance, isLoading } = useCreditStore()
  const [baseCredits, setBaseCredits] = useState<number>(0)

  useEffect(() => {
    fetch('/api/user/sidebar-stats')
      .then(r => r.ok ? r.json() : null)
      .then((data: { baseCredits?: number } | null) => {
        if (data?.baseCredits) setBaseCredits(data.baseCredits)
      })
      .catch(() => {})
  }, [])

  const safePlanSlug = planSlug || 'free'
  const effectiveTotal = Math.max(baseCredits, balance ?? 0)
  const percent = effectiveTotal > 0
    ? Math.min(100, Math.round(((balance ?? 0) / effectiveTotal) * 100))
    : 0

  const barColor =
    percent > 40 ? 'bg-primary' :
    percent > 15 ? 'bg-amber-500' :
    'bg-red-500'

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
        <div className="h-4 w-1/3 bg-muted rounded" />
        <div className="h-2 w-full bg-muted rounded-full" />
        <div className="h-3 w-1/4 bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Row 1 — balance + plan badge */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Credits remaining</p>
          <p className="text-2xl font-semibold text-foreground">{balance ?? 0}</p>
        </div>
        <span className="text-[11px] font-semibold tracking-wide uppercase
                         text-muted-foreground bg-muted/10 px-2 py-1 rounded-md">
          {safePlanSlug} plan
        </span>
      </div>

      {/* Row 2 — progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Row 3 — percent */}
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">
          {percent}% left
        </span>
      </div>

      {/* Row 4 — upgrade banner (free only) */}
      {safePlanSlug === 'free' && (
        <div className="flex items-center justify-between
                        bg-primary/10 border border-primary/20
                        rounded-lg px-4 py-3 mt-1">
          <div>
            <p className="text-sm font-medium text-foreground">
              Upgrade to Lite
            </p>
            <p className="text-xs text-muted-foreground">
              200 credits/month + history + PDF downloads
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-sm font-medium text-primary hover:underline ml-4 shrink-0"
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Row 4 — upgrade banner (lite only) */}
      {safePlanSlug === 'lite' && (
        <div className="flex items-center justify-between
                        bg-primary/10 border border-primary/20
                        rounded-lg px-4 py-3 mt-1">
          <div>
            <p className="text-sm font-medium text-foreground">
              Upgrade to Pro
            </p>
            <p className="text-xs text-muted-foreground">
              700 credits at ₹1.4/credit — best value
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-sm font-medium text-primary hover:underline ml-4 shrink-0"
          >
            Upgrade →
          </Link>
        </div>
      )}
    </div>
  )
}
