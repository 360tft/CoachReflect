'use client'

import { useState, useEffect } from 'react'
import { useRevenueCat } from '@/hooks/use-revenuecat'
import { isNativePlatform } from '@/lib/platform'
import { formatPackagePrice, getPackagePeriod } from '@/lib/revenuecat'
import { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { Button } from '@/app/components/ui/button'

type BillingPeriod = 'monthly' | 'annual'

interface IAPBillingActionsProps {
  hasSubscription: boolean
  isCancelling?: boolean
  billingPeriod?: BillingPeriod
  userId?: string
  onSubscriptionChange?: () => void
}

/**
 * Billing actions component that uses RevenueCat for native platforms
 * and falls back to Stripe for web
 */
export function IAPBillingActions({
  hasSubscription,
  isCancelling = false,
  billingPeriod = 'monthly',
  userId,
  onSubscriptionChange,
}: IAPBillingActionsProps) {
  const [isNative, setIsNative] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)

  const {
    isInitialized,
    isLoading: rcLoading,
    packages,
    hasProAccess,
    error: rcError,
    purchase,
    restore,
  } = useRevenueCat(userId)

  useEffect(() => {
    setIsNative(isNativePlatform())
  }, [])

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      const preferredPackage = packages.find(pkg =>
        billingPeriod === 'annual'
          ? pkg.identifier.includes('annual') || pkg.identifier.includes('yearly')
          : pkg.identifier.includes('monthly')
      )
      setSelectedPackage(preferredPackage || packages[0])
    }
  }, [packages, billingPeriod, selectedPackage])

  const handleStripeCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_period: billingPeriod }),
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout. Please try again.')
      }
    } catch {
      setError('Unable to connect to payment system. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStripePortal = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to open billing portal. Please try again.')
      }
    } catch {
      setError('Unable to connect to billing portal. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleIAPPurchase = async () => {
    if (!selectedPackage) {
      setError('No subscription package available')
      return
    }

    setLoading(true)
    setError(null)

    const success = await purchase(selectedPackage)

    setLoading(false)

    if (success) {
      onSubscriptionChange?.()
      window.location.reload()
    } else if (rcError && rcError !== 'cancelled') {
      setError(rcError)
    }
  }

  const handleRestore = async () => {
    setLoading(true)
    setError(null)

    const hasAccess = await restore()

    setLoading(false)

    if (hasAccess) {
      onSubscriptionChange?.()
      window.location.reload()
    } else {
      setError('No previous purchases found to restore.')
    }
  }

  const isLoadingState = loading || rcLoading

  // For users with subscription (manage/cancel)
  if (hasSubscription || hasProAccess) {
    if (isNative) {
      return (
        <div className="space-y-3">
          {(error || rcError) && (
            <div
              role="alert"
              className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md"
            >
              {error || rcError}
            </div>
          )}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              To manage or cancel your subscription, go to your device&apos;s subscription settings:
            </p>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li><strong>iPhone/iPad:</strong> Settings &rarr; Apple ID &rarr; Subscriptions</li>
              <li><strong>Android:</strong> Play Store &rarr; Payments &amp; subscriptions</li>
            </ul>
          </div>
          <Button
            onClick={handleRestore}
            disabled={isLoadingState}
            variant="outline"
          >
            {isLoadingState ? 'Loading...' : 'Restore Purchases'}
          </Button>
        </div>
      )
    }

    // On web, use Stripe portal
    return (
      <div className="space-y-3">
        {error && (
          <div
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md"
          >
            {error}
          </div>
        )}
        {isCancelling ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Your subscription is set to cancel. You&apos;ll retain access until the end of your billing period.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleStripePortal}
                disabled={isLoadingState}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoadingState ? 'Loading...' : 'Resume subscription'}
              </Button>
              <Button
                onClick={handleStripePortal}
                disabled={isLoadingState}
                variant="outline"
              >
                {isLoadingState ? 'Loading...' : 'Manage billing'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleStripePortal}
              disabled={isLoadingState}
              variant="outline"
            >
              {isLoadingState ? 'Loading...' : 'Manage billing'}
            </Button>
            <button
              onClick={handleStripePortal}
              disabled={isLoadingState}
              className="text-sm text-muted-foreground hover:text-foreground underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-not-allowed"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>
    )
  }

  // For users without subscription (purchase)
  return (
    <div className="space-y-3">
      {(error || rcError) && (
        <div
          role="alert"
          className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md"
        >
          {error || rcError}
        </div>
      )}

      {/* Native: Show IAP options */}
      {isNative && isInitialized && packages.length > 0 ? (
        <div className="space-y-3">
          {packages.length > 1 && (
            <div className="flex gap-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.identifier}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPackage?.identifier === pkg.identifier
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {formatPackagePrice(pkg)}{getPackagePeriod(pkg)}
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={handleIAPPurchase}
            disabled={isLoadingState || !selectedPackage}
            className="w-full"
          >
            {isLoadingState ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                Processing...
              </span>
            ) : selectedPackage ? (
              `Subscribe for ${formatPackagePrice(selectedPackage)}${getPackagePeriod(selectedPackage)}`
            ) : (
              'Subscribe to Pro'
            )}
          </Button>

          <button
            onClick={handleRestore}
            disabled={isLoadingState}
            className="w-full text-sm text-muted-foreground hover:text-foreground underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-not-allowed"
          >
            Restore previous purchase
          </button>
        </div>
      ) : (
        /* Web or native not initialized: Use Stripe */
        <Button
          onClick={handleStripeCheckout}
          disabled={isLoadingState}
        >
          {isLoadingState ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
              Loading...
            </span>
          ) : (
            'Upgrade to Pro'
          )}
        </Button>
      )}
    </div>
  )
}
