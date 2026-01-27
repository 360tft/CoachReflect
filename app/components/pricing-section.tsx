"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { PRICING, type BillingPeriod, formatPrice } from "@/lib/config"

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly")

  const proPrice = billing === "monthly"
    ? formatPrice(PRICING.PRO.monthly.price)
    : formatPrice(PRICING.PRO.annual.price)
  const proPeriod = billing === "monthly" ? "/month" : "/year"
  const proMonthly = billing === "annual"
    ? `${formatPrice(PRICING.PRO.annual.monthlyEquivalent)}/mo`
    : null

  return (
    <section id="pricing" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
      <p className="text-center text-muted-foreground mb-8">
        Start free, upgrade when you need more
      </p>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2 mb-12">
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setBilling("monthly")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              billing === "annual"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span className="ml-1 text-xs text-green-600 dark:text-green-400">
              Save {PRICING.PRO.annual.savings}%
            </span>
          </button>
        </div>
      </div>

      {/* Free + Pro Plans */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Get started with reflection</CardDescription>
            <div className="text-3xl font-bold mt-4">$0</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> 5 messages/day
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> Guided prompts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> Mood tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> 7 days of history
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="text-muted-foreground">-</span> No voice notes
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="text-muted-foreground">-</span> No AI insights
              </li>
            </ul>
            <Link href="/signup" className="block mt-6">
              <Button variant="outline" className="w-full">Get Started</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-brand border-2 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-brand text-white">Recommended</Badge>
          </div>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For dedicated coaches</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">{proPrice}</span>
              <span className="text-lg font-normal">{proPeriod}</span>
              {proMonthly && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Just {proMonthly}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> Unlimited messages
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> Voice notes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> Session plan upload
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> AI-powered insights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> Full analytics history
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> Export reflections
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> CPD documentation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">+</span> AI memory (learns your style)
              </li>
            </ul>
            <Link href={`/signup?plan=pro&billing=${billing}`} className="block mt-6">
              <Button className="w-full bg-brand hover:bg-brand-hover !text-white">Start Pro</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* FAQ / Note */}
      <p className="text-center text-sm text-muted-foreground mt-12 max-w-2xl mx-auto">
        All plans include a 7-day free trial. Cancel anytime.
        Need something custom? <Link href="/contact" className="underline">Contact us</Link>.
      </p>
    </section>
  )
}
