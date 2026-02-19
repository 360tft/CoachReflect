"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { PRICING, CLUB_TIERS, type BillingPeriod, formatPrice } from "@/lib/config"
import { NativeHidden } from "@/app/components/native-hidden"

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly")
  const [planType, setPlanType] = useState<"individual" | "teams">("individual")

  const proPrice = billing === "monthly"
    ? formatPrice(PRICING.PRO.monthly.price)
    : formatPrice(PRICING.PRO.annual.promoPrice)
  const proOriginalPrice = billing === "annual"
    ? formatPrice(PRICING.PRO.annual.price)
    : null
  const proPeriod = billing === "monthly" ? "/month" : "/first year"
  const proMonthly = billing === "annual"
    ? `${formatPrice(PRICING.PRO.annual.promoMonthlyEquivalent)}/mo`
    : null

  const proPlusPrice = billing === "monthly"
    ? formatPrice(PRICING.PRO_PLUS.monthly.price)
    : formatPrice(PRICING.PRO_PLUS.annual.promoPrice)
  const proPlusOriginalPrice = billing === "annual"
    ? formatPrice(PRICING.PRO_PLUS.annual.price)
    : null
  const proPlusPeriod = billing === "monthly" ? "/month" : "/first year"
  const proPlusMonthly = billing === "annual"
    ? `${formatPrice(PRICING.PRO_PLUS.annual.promoMonthlyEquivalent)}/mo`
    : null

  return (
    <section id="pricing" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-4">Less Than a Coffee a Week</h2>
      <p className="text-center text-muted-foreground mb-4">
        Start free. Upgrade when you see the difference.
      </p>
      <p className="text-center text-sm font-medium text-foreground mb-8">
        Try Pro free for 7 days. No charge until day 8. Cancel with one click.
      </p>

      {/* Plan Type Toggle */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setPlanType("individual")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              planType === "individual"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setPlanType("teams")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              planType === "teams"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Teams
          </button>
        </div>
      </div>

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
            {planType === "individual" ? (
              <span className="ml-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                50% off first year
              </span>
            ) : (
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                Save 17%
              </span>
            )}
          </button>
        </div>
      </div>

      {planType === "individual" ? (
      /* Free + Pro + Pro+ Plans */
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Free */}
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Get started and see what reflection does</CardDescription>
            <div className="text-3xl font-bold mt-4">$0</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> 2 reflections a day to get started
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Guided prompts after every session
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Track your mood and energy
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> 7 days of history
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Ask for drills with animated pitch diagrams
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-muted-foreground mt-0.5">-</span> No voice notes
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-muted-foreground mt-0.5">-</span> No AI insights
              </li>
            </ul>
            <NativeHidden>
              <Link href="/signup" className="block mt-6">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </NativeHidden>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-brand border-2 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-brand text-white">Recommended</Badge>
          </div>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>Reflect without limits</CardDescription>
            <div className="mt-4">
              {proOriginalPrice && (
                <span className="text-lg text-muted-foreground line-through mr-2">{proOriginalPrice}</span>
              )}
              <span className="text-3xl font-bold">{proPrice}</span>
              <span className="text-lg font-normal">{proPeriod}</span>
              {proMonthly && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Just {proMonthly} — full price from year 2
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Everything in Free, plus:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Reflect on the drive home</strong> (4 voice notes/month)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Never wonder &apos;what should I write?&apos;</strong> again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Design sessions and drills, or get feedback on plans you&apos;ve got
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> The AI remembers what you forget
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Build a coaching library you can search forever
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Evidence your development for CPD
              </li>
            </ul>
            <NativeHidden>
              <Link href={`/signup?plan=pro&billing=${billing}`} className="block mt-6">
                <Button className="w-full bg-brand hover:bg-brand-hover !text-white">Start Pro</Button>
              </Link>
            </NativeHidden>
          </CardContent>
        </Card>

        {/* Pro+ */}
        <Card className="relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="outline">Most complete</Badge>
          </div>
          <CardHeader>
            <CardTitle>Pro+</CardTitle>
            <CardDescription>The full picture of your coaching</CardDescription>
            <div className="mt-4">
              {proPlusOriginalPrice && (
                <span className="text-lg text-muted-foreground line-through mr-2">{proPlusOriginalPrice}</span>
              )}
              <span className="text-3xl font-bold">{proPlusPrice}</span>
              <span className="text-lg font-normal">{proPlusPeriod}</span>
              {proPlusMonthly && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Just {proPlusMonthly} — full price from year 2
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Everything in Pro, plus:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Unlimited voice notes</strong> — record quick thoughts any time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>12 full session recordings/month</strong> — deep-dive into entire sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Hear how you actually coach</strong> — full session recordings analysed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Track progression across 6-week blocks</strong> — see what&apos;s working</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>CPD documentation</strong> — evidence your growth automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Coaching tips matched to your players&apos; age group</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Upload your coaching syllabus — AI learns your philosophy
              </li>
            </ul>
            <NativeHidden>
              <Link href={`/signup?plan=pro_plus&billing=${billing}`} className="block mt-6">
                <Button variant="outline" className="w-full">Start Pro+</Button>
              </Link>
            </NativeHidden>
          </CardContent>
        </Card>
      </div>
      ) : (
      /* Club/Team Plans */
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {CLUB_TIERS.map((tier) => {
          const price = billing === "monthly" ? tier.monthlyPrice : tier.annualPrice
          const period = billing === "monthly" ? "/month" : "/year"
          const perCoach = billing === "monthly"
            ? tier.perCoachMonthly
            : Math.round((tier.annualPrice / 12 / tier.maxSeats) * 100) / 100

          return (
            <Card
              key={tier.id}
              className={tier.recommended ? "border-brand border-2 relative" : "relative"}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand text-white">Recommended</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>Up to {tier.maxSeats} coaches</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{formatPrice(price)}</span>
                  <span className="text-lg font-normal">{period}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatPrice(perCoach)}/coach/mo
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Every coach gets Pro+ access:</p>
                <ul className="space-y-2 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <NativeHidden>
                  <Link
                    href={`/dashboard/club/create?tier=${tier.id}&billing=${billing}`}
                    className="block mt-6"
                  >
                    <Button
                      className={tier.recommended
                        ? "w-full bg-brand hover:bg-brand-hover !text-white"
                        : "w-full"
                      }
                      variant={tier.recommended ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </Link>
                </NativeHidden>
              </CardContent>
            </Card>
          )
        })}
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
