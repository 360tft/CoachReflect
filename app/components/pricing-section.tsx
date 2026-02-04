"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { PRICING, type BillingPeriod, formatPrice } from "@/lib/config"
import { NativeHidden } from "@/app/components/native-hidden"

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly")

  const proPrice = billing === "monthly"
    ? formatPrice(PRICING.PRO.monthly.price)
    : formatPrice(PRICING.PRO.annual.price)
  const proPeriod = billing === "monthly" ? "/month" : "/year"
  const proMonthly = billing === "annual"
    ? `${formatPrice(PRICING.PRO.annual.monthlyEquivalent)}/mo`
    : null

  const proPlusPrice = billing === "monthly"
    ? formatPrice(PRICING.PRO_PLUS.monthly.price)
    : formatPrice(PRICING.PRO_PLUS.annual.price)
  const proPlusPeriod = billing === "monthly" ? "/month" : "/year"
  const proPlusMonthly = billing === "annual"
    ? `${formatPrice(PRICING.PRO_PLUS.annual.monthlyEquivalent)}/mo`
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

      {/* Free + Pro + Pro+ Plans */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Free */}
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Start reflecting</CardDescription>
            <div className="text-3xl font-bold mt-4">$0</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> 5 reflections a day to build the habit
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
            <CardDescription>Coach smarter</CardDescription>
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
            <p className="text-xs text-muted-foreground mb-3">Everything in Free, plus:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Talk through sessions instead of typing</strong> (4 voice notes/month)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Structured reflections</strong> that ask the right questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Upload session plans and get AI feedback
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> AI spots patterns across your reflections
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Full history — nothing gets lost
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span> Export your reflections
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
            <CardDescription>Grow without limits</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">{proPlusPrice}</span>
              <span className="text-lg font-normal">{proPlusPeriod}</span>
              {proPlusMonthly && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Just {proPlusMonthly}
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
                <span><strong>Communication analysis</strong> — understand how you coach, not just what</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Development blocks</strong> — track structured progression</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>CPD documentation</strong> — evidence your growth automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span><strong>Age-appropriate nudges</strong> — tailored to your players&apos; stage</span>
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

      {/* FAQ / Note */}
      <p className="text-center text-sm text-muted-foreground mt-12 max-w-2xl mx-auto">
        All plans include a 7-day free trial. Cancel anytime.
        Need something custom? <Link href="/contact" className="underline">Contact us</Link>.
      </p>
    </section>
  )
}
