'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { PRICING, formatPrice } from '@/lib/config'
import { useRevenueCat } from '@/hooks/use-revenuecat'
import { isNativePlatform } from '@/lib/platform'
import { formatPackagePrice, getPackagePeriod } from '@/lib/revenuecat'

declare global {
  interface Window {
    FPROM?: { data?: { tid?: string } }
  }
}

type ModalVariant = 'limit_reached' | 'voice_notes' | 'session_plan' | 'history' | 'analytics' | 'players' | 'generic'

interface UpgradeModalProps {
  variant: ModalVariant
  isOpen: boolean
  onClose: () => void
}

const VARIANT_CONFIG: Record<ModalVariant, { title: string; subtitle: string }> = {
  limit_reached: {
    title: "Two reflections down. The rest of today's coaching insights are slipping away.",
    subtitle: "You are already doing the work. Most coaching breakthroughs come from the third or fourth thought after a session. Pro catches them all.",
  },
  voice_notes: {
    title: "Record it on the drive home",
    subtitle: "You know that feeling 10 minutes after a session? The one where everything is still clear? Voice notes capture it before it fades.",
  },
  session_plan: {
    title: 'Get honest feedback before you coach',
    subtitle: "Upload your session plan and get AI feedback before you step on the pitch. Walk out prepared, not hoping.",
  },
  history: {
    title: "Your best coaching insight is buried in last month's reflections",
    subtitle: "Right now you can only see 7 days. The coaches who improve fastest track patterns over months. Full history makes that possible.",
  },
  analytics: {
    title: 'One week shows activity. Four weeks reveals patterns.',
    subtitle: "Burnout signals, player development trends, your recurring blind spots. They only appear when you zoom out. Pro gives you the full picture.",
  },
  players: {
    title: 'You mentioned the same 3 players again this week',
    subtitle: "Are you giving equal attention to everyone? Pro tracks every player mention across every session so nothing falls through the cracks.",
  },
  generic: {
    title: 'The coaches who improve fastest reflect after every session',
    subtitle: 'No daily limits, voice notes on the drive home, and an AI that remembers every session you have ever reflected on.',
  },
}

const PRO_FEATURES = [
  'Never forget a coaching insight again. Unlimited reflections, every day.',
  'Reflect on the drive home. Two-minute voice notes, hands-free.',
  'Spot patterns you would never notice. The AI connects dots across sessions.',
  'Walk into every session prepared. Upload plans, get honest AI feedback.',
  'Track every player across every session. No one falls through the cracks.',
  'CPD evidence generated automatically. Zero extra paperwork.',
]

const TESTIMONIAL = {
  quote: "It allowed me to guide my thinking and analysis of my coaching experience thoroughly, with active listening and offered actionable solutions moving forwards.",
  author: "The S Resource",
  role: "Coaching Educator",
}

export function UpgradeModal({ variant, isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNative, setIsNative] = useState(false)
  const config = VARIANT_CONFIG[variant]

  const {
    isInitialized: rcInitialized,
    isLoading: rcLoading,
    packages,
    error: rcError,
    purchase,
    restore,
  } = useRevenueCat()

  useEffect(() => {
    setIsNative(isNativePlatform())
  }, [])

  if (!isOpen) return null

  // Pick the first monthly Pro package from RevenueCat offerings
  const proPackage = packages.find(pkg =>
    pkg.identifier.includes('monthly')
  ) || packages[0] || null

  const handleStripeUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          plan: 'pro',
          billing_period: 'monthly',
          fp_tid: window.FPROM?.data?.tid || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Checkout failed' }))
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not start checkout. Please try again.')
      }
    } catch {
      setError('Unable to connect to payment system. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleIAPUpgrade = async () => {
    if (!proPackage) {
      setError('No subscription package available. Please try again later.')
      return
    }
    setLoading(true)
    setError(null)
    const success = await purchase(proPackage)
    setLoading(false)
    if (success) {
      onClose()
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
      onClose()
      window.location.reload()
    } else {
      setError('No previous purchases found to restore.')
    }
  }

  const handleUpgrade = isNative ? handleIAPUpgrade : handleStripeUpgrade
  const isLoadingState = loading || rcLoading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        {/* Gold gradient icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            {variant === 'limit_reached' ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : variant === 'voice_notes' ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2M12 19v3" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-1">{config.title}</h2>
        <p className="text-center text-muted-foreground mb-6">{config.subtitle}</p>

        {/* Feature list */}
        <ul className="space-y-3 mb-6">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Testimonial */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border/50">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            &quot;{TESTIMONIAL.quote}&quot;
          </p>
          <p className="text-xs font-medium mt-1">{TESTIMONIAL.author}, {TESTIMONIAL.role}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-2">
          {isNative && proPackage ? (
            <>
              <span className="text-3xl font-bold">{formatPackagePrice(proPackage)}</span>
              <span className="text-muted-foreground">{getPackagePeriod(proPackage)}</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold">{formatPrice(PRICING.PRO.monthly.price)}</span>
              <span className="text-muted-foreground">/month</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                That&apos;s $0.26/day. Less than your post-match coffee.
              </p>
            </>
          )}
        </div>

        {/* Social proof */}
        <p className="text-center text-xs text-muted-foreground mb-2">
          Join 1,500+ coaches in the FCA community already reflecting with Pro
        </p>

        {/* Risk reversal */}
        <p className="text-center text-sm text-muted-foreground mb-1">
          7-day free trial. Cancel in one tap, no questions asked.
        </p>
        <p className="text-center text-xs text-muted-foreground mb-4">
          If you do not reflect more in your first week, you should not keep it.
        </p>

        {/* Error message */}
        {(error || rcError) && (
          <p className="text-sm text-red-500 text-center mb-3">{error || rcError}</p>
        )}

        {/* CTA */}
        <Button
          onClick={handleUpgrade}
          disabled={isLoadingState || (isNative && rcInitialized && !proPackage)}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-6 text-base"
        >
          {isLoadingState ? 'Loading...' : isNative && proPackage
            ? `Subscribe for ${formatPackagePrice(proPackage)}${getPackagePeriod(proPackage)}`
            : 'Start 7-Day Free Trial'}
        </Button>

        {/* Restore purchases (native only) */}
        {isNative && (
          <button
            onClick={handleRestore}
            disabled={isLoadingState}
            className="w-full text-center text-sm text-muted-foreground mt-2 hover:text-foreground underline transition-colors disabled:opacity-50 disabled:no-underline"
          >
            Restore previous purchase
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-foreground transition-colors"
        >
          Not right now
        </button>
      </div>
    </div>
  )
}
