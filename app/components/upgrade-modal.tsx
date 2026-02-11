'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { PRICING, formatPrice } from '@/lib/config'

type ModalVariant = 'limit_reached' | 'voice_notes' | 'session_plan' | 'history' | 'analytics' | 'generic'

interface UpgradeModalProps {
  variant: ModalVariant
  isOpen: boolean
  onClose: () => void
}

const VARIANT_CONFIG: Record<ModalVariant, { title: string; subtitle: string }> = {
  limit_reached: {
    title: "You're getting somewhere",
    subtitle: "You've just used today's free reflections. Coaches who reflect consistently improve fastest.",
  },
  voice_notes: {
    title: 'Reflect on the drive home',
    subtitle: "Record your thoughts on the way home. No typing, no forgetting.",
  },
  session_plan: {
    title: 'Get feedback before you coach',
    subtitle: 'Upload your session plan and the AI gives you feedback before you step on the pitch.',
  },
  history: {
    title: 'Your coaching insights are waiting',
    subtitle: "You have older reflections with coaching insights you've already earned. Unlock them.",
  },
  analytics: {
    title: 'See what 4+ weeks reveals',
    subtitle: 'Full analytics show patterns across months, not just the last week.',
  },
  generic: {
    title: 'Get more from every session',
    subtitle: 'Pro coaches reflect without limits and see patterns others miss.',
  },
}

const PRO_FEATURES = [
  'Reflect after every session, not just two',
  'Talk through sessions on the drive home',
  'See patterns you\'ve been missing for years',
  'Design sessions, drills, and SSGs — or get feedback on plans you\'ve got',
  'Build a searchable coaching library forever',
  'Evidence your development for CPD',
]

export function UpgradeModal({ variant, isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const config = VARIANT_CONFIG[variant]

  if (!isOpen) return null

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ plan: 'pro', billing_period: 'monthly' }),
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

        {/* Price */}
        <div className="text-center mb-2">
          <span className="text-3xl font-bold">{formatPrice(PRICING.PRO.monthly.price)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>

        {/* Risk reversal */}
        <p className="text-center text-sm text-muted-foreground mb-1">
          7-day free trial. No charge until day 8. Cancel anytime.
        </p>
        <p className="text-center text-xs text-muted-foreground mb-4">
          Built by Kevin Middleton for the FCA community of 1,500+ coaches
        </p>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 text-center mb-3">{error}</p>
        )}

        {/* CTA */}
        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-6 text-base"
        >
          {loading ? 'Loading...' : 'Start 7-Day Free Trial'}
        </Button>

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
