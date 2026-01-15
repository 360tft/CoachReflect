"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"

export function BillingToggle() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")

  return (
    <div className="space-y-4">
      {/* Toggle */}
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
          <span className="ml-1 text-xs text-green-600 dark:text-green-400">Save 17%</span>
        </button>
      </div>

      {/* Price display */}
      <div className="text-center">
        {billing === "monthly" ? (
          <div>
            <span className="text-3xl font-bold">$7.99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        ) : (
          <div>
            <span className="text-3xl font-bold">$79</span>
            <span className="text-muted-foreground">/year</span>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              That&apos;s $6.58/month - save $16.88/year
            </p>
          </div>
        )}
      </div>

      {/* Checkout form */}
      <form action="/api/stripe/checkout" method="POST">
        <input type="hidden" name="billing" value={billing} />
        <Button type="submit" className="w-full">
          {billing === "monthly"
            ? "Upgrade to Pro - $7.99/month"
            : "Upgrade to Pro - $79/year"
          }
        </Button>
      </form>
    </div>
  )
}
