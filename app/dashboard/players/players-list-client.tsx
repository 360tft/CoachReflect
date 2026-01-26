"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"

interface PlayerSummary {
  name: string
  total_mentions: number
  sentiment: {
    positive: number
    concern: number
    neutral: number
  }
  dominant_sentiment: 'positive' | 'concern' | 'neutral'
  last_mentioned: string
}

interface PlayersListClientProps {
  isSubscribed: boolean
}

export function PlayersListClient({ isSubscribed }: PlayersListClientProps) {
  const [players, setPlayers] = useState<PlayerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch("/api/analytics/players")
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to fetch players")
        }
        const data = await res.json()
        setPlayers(data.players)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load players")
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="h-6 bg-muted rounded animate-pulse w-32 mb-2" />
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (players.length === 0) {
    return (
      <div className="space-y-4">
        {/* Upsell banner for free users */}
        {!isSubscribed && (
          <Card className="border-brand/30 bg-brand/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    Free Plan: Limited to last 7 days
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Player tracking is based on recent reflections. Upgrade to Pro to track player development across your full history.
                  </p>
                </div>
                <Link href="/dashboard/settings">
                  <Button className="bg-brand hover:bg-brand-hover whitespace-nowrap" size="sm">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">-</div>
            <h3 className="font-semibold mb-2">
              {isSubscribed
                ? "No players mentioned yet"
                : "No players mentioned in the last 7 days"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isSubscribed
                ? "Start reflecting on your sessions and mention your players by name to track their development over time."
                : "Mention players by name in your reflections. Upgrade to Pro to see all players from your full history."}
            </p>
            <Link href="/dashboard/chat">
              <Button className="bg-brand hover:bg-brand-hover">
                Start a Reflection
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500'
      case 'concern': return 'text-primary-foreground0'
      default: return 'text-gray-400'
    }
  }

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/10 border-green-500/20'
      case 'concern': return 'bg-muted/500/10 border-primary/20'
      default: return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '+'
      case 'concern': return '!'
      default: return '-'
    }
  }

  return (
    <div className="space-y-4">
      {/* Upsell banner for free users */}
      {!isSubscribed && (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold">
                  Free Plan: Showing players from last 7 days only
                </p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro to track player development across your full history and access detailed timelines.
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button className="bg-brand hover:bg-brand-hover whitespace-nowrap" size="sm">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{players.length}</div>
            <p className="text-sm text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-500">
              {players.filter(p => p.dominant_sentiment === 'positive').length}
            </div>
            <p className="text-sm text-muted-foreground">Positive Mentions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary-foreground0">
              {players.filter(p => p.dominant_sentiment === 'concern').length}
            </div>
            <p className="text-sm text-muted-foreground">Need Attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Players List */}
      <div className="space-y-3">
        {players.map((player) => (
          <Link
            key={player.name}
            href={isSubscribed ? `/dashboard/players/${encodeURIComponent(player.name.toLowerCase())}` : "#"}
            className={!isSubscribed ? "cursor-not-allowed" : ""}
          >
            <Card className={`hover:border-brand/50 transition-colors ${getSentimentBg(player.dominant_sentiment)}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${getSentimentColor(player.dominant_sentiment)} bg-muted`}>
                      {getSentimentIcon(player.dominant_sentiment)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {player.total_mentions} mention{player.total_mentions !== 1 ? 's' : ''} - Last: {new Date(player.last_mentioned).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Sentiment bar */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-green-500">{player.sentiment.positive}</span>
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${(player.sentiment.positive / player.total_mentions) * 100}%` }}
                        />
                        <div
                          className="bg-muted/500 h-full"
                          style={{ width: `${(player.sentiment.concern / player.total_mentions) * 100}%` }}
                        />
                        <div className="bg-gray-400 h-full flex-1" />
                      </div>
                      <span className="text-xs text-primary-foreground0">{player.sentiment.concern}</span>
                    </div>
                    {isSubscribed && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  )
}
