"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"

interface PlayerMention {
  name: string
  count: number
  sentiment: {
    positive: number
    concern: number
    neutral: number
  }
}

interface ThemeCount {
  theme_id: string
  theme_name: string
  count: number
  avg_confidence: number
}

interface AnalyticsData {
  period: string
  start_date: string
  end_date: string
  summary: {
    total_messages: number
    total_reflections: number
    total_voice_notes: number
    total_session_plans: number
    active_days: number
  }
  players: PlayerMention[]
  themes: ThemeCount[]
  sentiment_trend: {
    date: string
    sentiment: string
    energy: number | null
  }[]
  key_insights: string[]
}

interface AnalyticsDashboardProps {
  isSubscribed: boolean
}

export function AnalyticsDashboard({ isSubscribed }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<"4w" | "8w" | "12w">("4w")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const periods = [
    { value: "4w", label: "4 Weeks", requiresPro: false },
    { value: "8w", label: "8 Weeks", requiresPro: true },
    { value: "12w", label: "12 Weeks", requiresPro: true },
  ] as const

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/analytics/patterns?period=${period}`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to fetch analytics")
        }
        const analytics = await res.json()
        setData(analytics)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.value)}
            disabled={p.requiresPro && !isSubscribed}
          >
            {p.label}
            {p.requiresPro && !isSubscribed && (
              <span className="ml-1 text-xs opacity-60">Pro</span>
            )}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.summary.total_messages}</div>
            <p className="text-sm text-muted-foreground">Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.summary.total_reflections}</div>
            <p className="text-sm text-muted-foreground">Reflections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.summary.total_voice_notes}</div>
            <p className="text-sm text-muted-foreground">Voice Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.summary.total_session_plans}</div>
            <p className="text-sm text-muted-foreground">Session Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.summary.active_days}</div>
            <p className="text-sm text-muted-foreground">Active Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      {data.key_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>What we noticed in your reflections</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.key_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand font-bold">-</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle>Players Mentioned</CardTitle>
            <CardDescription>Who you talk about most</CardDescription>
          </CardHeader>
          <CardContent>
            {data.players.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No players mentioned yet. Keep reflecting!
              </p>
            ) : (
              <div className="space-y-3">
                {data.players.map((player, i) => {
                  const total = player.sentiment.positive + player.sentiment.concern + player.sentiment.neutral
                  const positivePercent = (player.sentiment.positive / total) * 100
                  const concernPercent = (player.sentiment.concern / total) * 100

                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{player.name}</span>
                        <span className="text-sm text-muted-foreground">{player.count}x</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${positivePercent}%` }}
                        />
                        <div
                          className="bg-muted/500 h-full"
                          style={{ width: `${concernPercent}%` }}
                        />
                        <div className="bg-gray-400 h-full flex-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Themes */}
        <Card>
          <CardHeader>
            <CardTitle>Coaching Themes</CardTitle>
            <CardDescription>What topics come up most</CardDescription>
          </CardHeader>
          <CardContent>
            {data.themes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No themes extracted yet. Keep reflecting!
              </p>
            ) : (
              <div className="space-y-3">
                {data.themes.map((theme, i) => {
                  const maxCount = data.themes[0]?.count || 1
                  const widthPercent = (theme.count / maxCount) * 100

                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium capitalize">
                          {theme.theme_name}
                        </span>
                        <span className="text-sm text-muted-foreground">{theme.count}x</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="bg-brand h-full rounded-full"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA for free users */}
      {!isSubscribed && (
        <Card className="bg-brand/10 border-brand/20">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">Unlock Full Analytics</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Pro for full analytics history, theme extraction, and detailed insights.
            </p>
            <Link href="/pricing">
              <Button className="bg-brand hover:bg-brand-hover">
                Upgrade to Pro
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
