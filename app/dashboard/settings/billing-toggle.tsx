"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"

export function BillingToggle() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [plan, setPlan] = useState<"pro" | "pro_plus">("pro")

  const prices = {
    pro: { monthly: 9.99, annual: 99 },
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
          <p className="text-sm text-muted-foreground">4 voice notes/mo</p>
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
          <p className="text-sm text-muted-foreground">12 voice notes + syllabus</p>
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
        <ul className="text-muted-foreground space-y-1">
          <li>+ Unlimited reflections</li>
          <li>+ {plan === "pro" ? "4" : "12"} voice notes per month</li>
          <li>+ Session plan upload with AI analysis</li>
          <li>+ AI-powered insights and patterns</li>
          <li>+ Full analytics history</li>
          {plan === "pro_plus" && (
            <>
              <li>+ Upload your coaching syllabus</li>
              <li>+ AI learns your coaching philosophy</li>
            </>
          )}
        </ul>
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

      {/* Checkout form */}
      <form action="/api/stripe/checkout" method="POST">
        <input type="hidden" name="billing" value={billing} />
        <input type="hidden" name="plan" value={plan} />
        <Button type="submit" className="w-full">
          Upgrade to {plan === "pro" ? "Pro" : "Pro+"} - ${currentPrice}/{billing === "monthly" ? "mo" : "yr"}
        </Button>
      </form>
    </div>
  )
}
