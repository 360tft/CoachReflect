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
          <p className="text-sm text-muted-foreground">Talk through your sessions</p>
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
          <p className="text-sm text-muted-foreground">Full recordings + deep analysis</p>
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
            <li>+ Talk through sessions instead of typing (4 voice notes/month)</li>
            <li>+ Structured reflections that ask the right questions</li>
            <li>+ Upload session plans and get AI feedback</li>
            <li>+ AI spots patterns across your reflections</li>
            <li>+ Full history — nothing gets lost</li>
            <li>+ Export your reflections</li>
          </ul>
        ) : (
          <ul className="text-muted-foreground space-y-1">
            <li>+ Everything in Pro, plus:</li>
            <li>+ Unlimited voice notes — record quick thoughts any time</li>
            <li>+ 12 full session recordings/month</li>
            <li>+ Communication analysis — understand how you coach</li>
            <li>+ Development blocks — track structured progression</li>
            <li>+ CPD documentation — evidence your growth automatically</li>
            <li>+ Age-appropriate nudges — tailored to your players</li>
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
