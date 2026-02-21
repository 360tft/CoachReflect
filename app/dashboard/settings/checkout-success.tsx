'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isPromoActive } from '@/lib/config'

export function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const [visible, setVisible] = useState(false)
  const promoActive = isPromoActive()

  useEffect(() => {
    if (success || canceled) {
      setVisible(true)
    }

    // After successful checkout, refresh the page after a short delay
    // to pick up the webhook-updated subscription status
    if (success) {
      const timer = setTimeout(() => {
        router.refresh()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, canceled, router])

  if (!visible) return null

  if (canceled) {
    return (
      <div className="mb-4 p-4 rounded-lg border border-muted bg-muted/50">
        <p className="font-medium">Checkout cancelled</p>
        <p className="text-sm text-muted-foreground mt-1">
          No worries. You can upgrade whenever you're ready.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mb-4 p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
        <p className="font-medium text-green-900 dark:text-green-100">
          You're on Pro! Your 7-day free trial has started.
        </p>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
          You won't be charged until the trial ends. Cancel anytime from this page.
        </p>
        {promoActive && (
          <p className="text-sm text-green-700 dark:text-green-300 mt-1 font-medium">
            You've locked in 50% off your first year. Full price applies from year 2.
          </p>
        )}
      </div>
    )
  }

  return null
}
