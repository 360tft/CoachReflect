"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { CLUB_TIERS, formatPrice } from "@/lib/config"

export default function CreateClubPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTier = searchParams.get("tier") || "club"
  const initialBilling = searchParams.get("billing") || "monthly"

  const [clubName, setClubName] = useState("")
  const [tier, setTier] = useState(initialTier)
  const [billing, setBilling] = useState<"monthly" | "annual">(initialBilling as "monthly" | "annual")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTier = CLUB_TIERS.find((t) => t.id === tier) || CLUB_TIERS[0]
  const price = billing === "monthly" ? selectedTier.monthlyPrice : selectedTier.annualPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clubName.trim()) {
      setError("Please enter a club name")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/club-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: clubName.trim(),
          tier,
          billing,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Start a Club</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Your Coaching Club</CardTitle>
          <CardDescription>
            Get your whole coaching team reflecting with Pro+ access for everyone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Club Name */}
            <div>
              <label htmlFor="clubName" className="block text-sm font-medium mb-2">
                Club Name
              </label>
              <input
                id="clubName"
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g., Riverside FC Coaches"
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>

            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Plan</label>
              <div className="grid gap-3">
                {CLUB_TIERS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      tier === t.id
                        ? "border-brand bg-brand/5"
                        : "border-border hover:border-brand/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Up to {t.maxSeats} coaches
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatPrice(billing === "monthly" ? t.monthlyPrice : t.annualPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          /{billing === "monthly" ? "month" : "year"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">Billing Period</label>
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
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
                  <span className="ml-1 text-xs text-green-600">Save 10%</span>
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-medium mb-2">Every coach gets Pro+ access:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>+ 12 voice notes per month</li>
                <li>+ Session plan upload with AI analysis</li>
                <li>+ Shared club syllabus</li>
                <li>+ AI learns your club philosophy</li>
                <li>+ Full analytics history</li>
              </ul>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover"
            >
              {loading ? "Creating..." : `Continue to Payment - ${formatPrice(price)}/${billing === "monthly" ? "mo" : "yr"}`}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can invite coaches after checkout. Cancel anytime.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
