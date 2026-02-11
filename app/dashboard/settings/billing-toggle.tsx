"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"

export function BillingToggle() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [plan, setPlan] = useState<"pro" | "pro_plus">("pro")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prices = {
    pro: { monthly: 7.99, annual: 76.99 },
    pro_plus: { monthly: 19.99, annual: 199 },
  }

  const currentPrice = prices[plan][billing === "monthly" ? "monthly" : "annual"]
  const monthlyEquivalent = billing === "annual" ? (currentPrice / 12).toFixed(2) : null

  return (
    <div className="space-y-4">
      {/* Plan selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPlan("pro")}
          className={`p-3 rounded-lg border-2 text-left transition-colors ${
            plan === "pro"
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-muted-foreground/50"
          }`}
        >
          <p className="font-semibold">Pro</p>
          <p className="text-sm text-muted-foreground">Reflect without limits</p>
        </button>
        <button
          type="button"
          onClick={() => setPlan("pro_plus")}
          className={`p-3 rounded-lg border-2 text-left transition-colors ${
            plan === "pro_plus"
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-muted-foreground/50"
          }`}
        >
          <p className="font-semibold">Pro+</p>
          <p className="text-sm text-muted-foreground">The full picture of your coaching</p>
        </button>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            billing === "monthly"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBilling("annual")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            billing === "annual"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
          <span className="ml-1 text-xs text-green-600 dark:text-green-400">2 months free</span>
        </button>
      </div>

      {/* What's included */}
      <div className="text-sm space-y-1">
        <p className="font-medium">What&apos;s included:</p>
        {plan === "pro" ? (
          <ul className="text-muted-foreground space-y-1">
            <li>+ Reflect on the drive home (4 voice notes/month)</li>
            <li>+ Never wonder what to write again</li>
            <li>+ Design sessions and drills before you coach</li>
            <li>+ The AI remembers what you forget</li>
            <li>+ Searchable coaching library forever</li>
            <li>+ CPD evidence generated automatically</li>
          </ul>
        ) : (
          <ul className="text-muted-foreground space-y-1">
            <li>+ Everything in Pro, plus:</li>
            <li>+ Unlimited voice notes — record quick thoughts any time</li>
            <li>+ 12 full session recordings/month</li>
            <li>+ Hear how you actually coach — full session recordings analysed</li>
            <li>+ Track progression across 6-week blocks</li>
            <li>+ CPD documentation — evidence your growth automatically</li>
            <li>+ Coaching tips matched to your players' age group</li>
            <li>+ Upload your coaching syllabus</li>
          </ul>
        )}
      </div>

      {/* Price display */}
      <div className="text-center">
        <span className="text-3xl font-bold">${currentPrice}</span>
        <span className="text-muted-foreground">/{billing === "monthly" ? "month" : "year"}</span>
        {monthlyEquivalent && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Just ${monthlyEquivalent}/month
          </p>
        )}
      </div>

      {/* Risk reversal */}
      <p className="text-center text-sm text-muted-foreground">
        7-day free trial. Cancel anytime. No charge until day 8.
      </p>

      {/* Checkout */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
      <Button
        className="w-full"
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          setError(null)
          try {
            const res = await fetch('/api/stripe/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan, billing_period: billing }),
            })
            const data = await res.json()
            if (data.url) {
              window.location.href = data.url
            } else {
              setError(data.error || 'Could not start checkout. Please try again.')
            }
          } catch {
            setError('Unable to connect to payment system. Please try again.')
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading ? 'Loading...' : `Upgrade to ${plan === "pro" ? "Pro" : "Pro+"} - $${currentPrice}/${billing === "monthly" ? "mo" : "yr"}`}
      </Button>
    </div>
  )
}
