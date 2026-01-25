import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

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

// GET /api/analytics/players - Get all players mentioned by the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`players-list:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    const adminClient = createAdminClient()

    // Fetch all insights
    const { data: insights } = await adminClient
      .from("extracted_insights")
      .select("players_mentioned, created_at, session_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Aggregate players
    const playerMap = new Map<string, {
      mentions: number
      sentiment: { positive: number; concern: number; neutral: number }
      lastMentioned: string
    }>()

    insights?.forEach(insight => {
      const players = insight.players_mentioned as Array<{
        name: string
        sentiment: 'positive' | 'concern' | 'neutral'
      }> || []

      const date = insight.session_date || insight.created_at.split('T')[0]

      players.forEach(player => {
        const key = player.name.toLowerCase()
        const existing = playerMap.get(key) || {
          mentions: 0,
          sentiment: { positive: 0, concern: 0, neutral: 0 },
          lastMentioned: date,
        }

        existing.mentions++
        existing.sentiment[player.sentiment]++

        // Update last mentioned if this is more recent
        if (date > existing.lastMentioned) {
          existing.lastMentioned = date
        }

        playerMap.set(key, existing)
      })
    })

    // Convert to response format
    const players: PlayerSummary[] = Array.from(playerMap.entries())
      .map(([name, data]) => {
        // Determine dominant sentiment
        let dominantSentiment: 'positive' | 'concern' | 'neutral' = 'neutral'
        if (data.sentiment.positive > data.sentiment.concern && data.sentiment.positive > data.sentiment.neutral) {
          dominantSentiment = 'positive'
        } else if (data.sentiment.concern > data.sentiment.positive && data.sentiment.concern > data.sentiment.neutral) {
          dominantSentiment = 'concern'
        }

        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          total_mentions: data.mentions,
          sentiment: data.sentiment,
          dominant_sentiment: dominantSentiment,
          last_mentioned: data.lastMentioned,
        }
      })
      .sort((a, b) => b.total_mentions - a.total_mentions)

    return NextResponse.json({
      total_players: players.length,
      players,
    })

  } catch (error) {
    console.error("Players list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    )
  }
}
