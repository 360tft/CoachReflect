"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { PRICING, CLUB_TIERS, type BillingPeriod, formatPrice } from "@/lib/config"

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly")
  const [showClubs, setShowClubs] = useState(false)

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
      <div className="flex items-center justify-center gap-2 mb-8">
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

      {/* Individual / Club Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <button
          onClick={() => setShowClubs(false)}
          className={`text-sm font-medium transition-colors ${
            !showClubs ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Individual
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          onClick={() => setShowClubs(true)}
          className={`text-sm font-medium transition-colors ${
            showClubs ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Clubs & Teams
        </button>
      </div>

      {!showClubs ? (
        // Individual Plans
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
                  <span className="text-green-500">+</span> 3 voice notes/month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> Guided prompts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> Mood tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> 4 weeks analytics
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
              <Badge className="bg-brand text-white">Most Popular</Badge>
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
                  <span className="text-green-500">+</span> Unlimited voice notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> Session plan upload
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> AI-powered insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> Theme extraction
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
              </ul>
              <Link href={`/signup?plan=pro&billing=${billing}`} className="block mt-6">
                <Button className="w-full bg-brand hover:bg-brand-hover">Start Pro</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Club Plans
        <div>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get Pro access for your entire coaching staff. Save up to 59% compared to individual subscriptions.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {CLUB_TIERS.map((tier) => {
              const price = billing === "monthly" ? tier.monthlyPrice : tier.annualPrice
              const perCoach = billing === "monthly"
                ? tier.perCoachMonthly
                : (tier.annualPrice / 12 / tier.maxSeats)

              return (
                <Card
                  key={tier.id}
                  className={tier.recommended ? "border-brand border-2 relative" : ""}
                >
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-brand text-white">Best Value</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription>Up to {tier.maxSeats} coaches</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{formatPrice(price)}</span>
                      <span className="text-lg font-normal">{proPeriod}</span>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {formatPrice(perCoach)}/coach/mo ({tier.discount})
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-green-500">+</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/signup?plan=club&tier=${tier.id}&billing=${billing}`}
                      className="block mt-6"
                    >
                      <Button
                        className={`w-full ${
                          tier.recommended
                            ? "bg-brand hover:bg-brand-hover"
                            : ""
                        }`}
                        variant={tier.recommended ? "default" : "outline"}
                      >
                        Start {tier.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* FAQ / Note */}
      <p className="text-center text-sm text-muted-foreground mt-12 max-w-2xl mx-auto">
        All plans include a 7-day free trial. Cancel anytime.
        Need something custom? <Link href="/contact" className="underline">Contact us</Link>.
      </p>
    </section>
  )
}
