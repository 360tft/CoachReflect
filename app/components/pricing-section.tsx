"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")

  const proPrice = billing === "monthly" ? "$7.99" : "$79"
  const proPeriod = billing === "monthly" ? "/month" : "/year"
  const proMonthly = billing === "annual" ? "$6.58/mo" : null

  return (
    <section className="container mx-auto px-4 py-16">
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
            <span className="ml-1 text-xs text-green-600 dark:text-green-400">Save 17%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
                <span className="text-green-500">•</span> 5 reflections/month
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Guided prompts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Mood tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Basic insights
              </li>
            </ul>
            <Link href="/signup" className="block mt-6">
              <Button variant="outline" className="w-full">Get Started</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-amber-500 border-2 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-amber-500 text-white">Most Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For serious coaches</CardDescription>
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
                <span className="text-green-500">•</span> Unlimited reflections
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> AI-powered insights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Pattern detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Player tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Session plan upload
              </li>
            </ul>
            <Link href={`/signup?plan=pro&billing=${billing}`} className="block mt-6">
              <Button className="w-full bg-amber-600 hover:bg-amber-700">Start Pro Trial</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pro+ */}
        <Card>
          <CardHeader>
            <CardTitle>Pro+</CardTitle>
            <CardDescription>For coaching organizations</CardDescription>
            <div className="text-3xl font-bold mt-4">$29<span className="text-lg font-normal">/month</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Everything in Pro
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Team collaboration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> CPD documentation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span> Priority support
              </li>
            </ul>
            <Link href="/signup?plan=pro_plus" className="block mt-6">
              <Button variant="outline" className="w-full">Contact Us</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
