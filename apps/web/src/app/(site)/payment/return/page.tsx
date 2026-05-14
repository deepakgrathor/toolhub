'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useCreditStore } from '@/store/credits-store'

type PaymentStatus = 'loading' | 'paid' | 'pending' | 'failed' | 'not_found'

interface VerifyResponse {
  status: 'paid' | 'pending' | 'failed' | 'not_found'
  type?: 'credit_pack' | 'plan'
  credits?: number
}

const AUTO_REDIRECT_SECONDS = 4

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')
  const syncCredits = useCreditStore((s) => s.syncFromServer)

  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [paymentType, setPaymentType] = useState<'credit_pack' | 'plan' | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS)
  const MAX_RETRIES = 5

  const verifyPayment = useCallback(async () => {
    if (!orderId) {
      setStatus('not_found')
      return
    }

    try {
      const res = await fetch(`/api/payments/verify?order_id=${orderId}`)
      const data: VerifyResponse = await res.json()

      if (data.status === 'paid') {
        setStatus('paid')
        setPaymentType(data.type ?? null)
        setCredits(data.credits ?? 0)
      } else if (data.status === 'pending') {
        setStatus('pending')
      } else if (data.status === 'not_found') {
        setStatus('not_found')
      } else {
        setStatus('failed')
      }
    } catch {
      setStatus('failed')
    }
  }, [orderId])

  useEffect(() => {
    verifyPayment()
  }, [verifyPayment])

  // Auto-retry for pending state
  useEffect(() => {
    if (status !== 'pending') return
    if (retryCount >= MAX_RETRIES) return

    const timer = setTimeout(() => {
      setRetryCount((c) => c + 1)
      verifyPayment()
    }, 3000)

    return () => clearTimeout(timer)
  }, [status, retryCount, verifyPayment])

  // On success: sync credits + auto-redirect countdown
  useEffect(() => {
    if (status !== 'paid') return

    // Refresh credit balance in navbar immediately
    syncCredits()

    // Countdown → redirect to dashboard
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status, syncCredits, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
          <p className="text-muted-foreground text-sm">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center shadow-sm">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h1>

          {paymentType === 'credit_pack' ? (
            <p className="text-muted-foreground mb-1">
              <span className="font-semibold text-foreground">{credits} credits</span> have been added to your account.
            </p>
          ) : (
            <p className="text-muted-foreground mb-1">
              Your plan has been activated successfully.
            </p>
          )}

          <p className="text-xs text-muted-foreground mb-6">
            Redirecting to dashboard in {countdown}s...
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full inline-flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2.5 transition-colors"
            >
              Go to Dashboard
            </button>
            <Link
              href="/credits"
              className="w-full inline-flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent font-medium px-4 py-2.5 transition-colors"
            >
              View Credits
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">Invoice sent to your email</p>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center shadow-sm">
          <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment is being processed</h1>
          <p className="text-muted-foreground mb-6">This usually takes a few seconds.</p>

          {retryCount < MAX_RETRIES ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking status... ({retryCount + 1}/{MAX_RETRIES})</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground mb-2">
                Taking longer than expected. Try checking manually.
              </p>
              <button
                onClick={() => {
                  setRetryCount(0)
                  setStatus('loading')
                  verifyPayment()
                }}
                className="w-full inline-flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2.5 transition-colors"
              >
                Check Status
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center shadow-sm">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
          <p className="text-muted-foreground mb-1">Your payment could not be processed.</p>
          <p className="text-sm text-muted-foreground mb-6">No amount has been deducted.</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="w-full inline-flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2.5 transition-colors"
            >
              Try Again
            </button>
            <a
              href="mailto:support@setulix.com"
              className="w-full inline-flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent font-medium px-4 py-2.5 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    )
  }

  // not_found
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center shadow-sm">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Order not found</h1>
        <p className="text-muted-foreground mb-6">We couldn&apos;t find this order.</p>
        <Link
          href="/dashboard"
          className="w-full inline-flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2.5 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
