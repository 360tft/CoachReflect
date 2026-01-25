import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

interface PlayerMention {
  date: string
  sentiment: 'positive' | 'concern' | 'neutral'
  context: string
  conversation_id?: string
  reflection_id?: string
}

interface PlayerAnalyticsResponse {
  player_name: string
  total_mentions: number
  sentiment_breakdown: {
    positive: number
    concern: number
    neutral: number
  }
  sentiment_trend: 'improving' | 'declining' | 'stable'
  first_mentioned: string | null
  last_mentioned: string | null
  mentions: PlayerMention[]
  related_themes: { theme: string; count: number }[]
  notes: Array<{
    id: string
    note: string
    category: string
    created_at: string
  }>
}

// GET /api/analytics/player/[name]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const playerName = decodeURIComponent(name).toLowerCase()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`player-analytics:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Check subscription (Pro feature)
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single()

    const tier = profile?.subscription_tier || "free"
    if (tier === "free") {
      return NextResponse.json(
        { error: "Player timeline is a Pro feature", code: "UPGRADE_REQUIRED" },
        { status: 402 }
      )
    }

    const adminClient = createAdminClient()

    // Fetch all insights that mention this player
    const { data: insights } = await adminClient
      .from("extracted_insights")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Filter insights that mention this player
    const playerInsights = insights?.filter(insight => {
      const players = insight.players_mentioned as Array<{ name: string }> || []
      return players.some(p => p.name.toLowerCase() === playerName)
    }) || []

    // Build sentiment breakdown and mentions list
    const sentimentBreakdown = { positive: 0, concern: 0, neutral: 0 }
    const mentions: PlayerMention[] = []
    const themeMap = new Map<string, number>()

    // Track sentiment over time for trend analysis
    const sentimentByMonth: Record<string, { positive: number; concern: number; neutral: number }> = {}

    playerInsights.forEach(insight => {
      const players = insight.players_mentioned as Array<{
        name: string
        sentiment: 'positive' | 'concern' | 'neutral'
        context?: string
      }> || []

      const playerMention = players.find(p => p.name.toLowerCase() === playerName)
      if (playerMention) {
        sentimentBreakdown[playerMention.sentiment]++

        // Track by month
        const month = insight.created_at.substring(0, 7) // YYYY-MM
        if (!sentimentByMonth[month]) {
          sentimentByMonth[month] = { positive: 0, concern: 0, neutral: 0 }
        }
        sentimentByMonth[month][playerMention.sentiment]++

        mentions.push({
          date: insight.session_date || insight.created_at.split('T')[0],
          sentiment: playerMention.sentiment,
          context: playerMention.context || 'Mentioned in conversation',
          conversation_id: insight.conversation_id,
        })

        // Track related themes
        const themes = insight.themes as Array<{ theme_id: string }> || []
        themes.forEach(t => {
          themeMap.set(t.theme_id, (themeMap.get(t.theme_id) || 0) + 1)
        })
      }
    })

    // Calculate sentiment trend
    const months = Object.keys(sentimentByMonth).sort()
    let sentimentTrend: 'improving' | 'declining' | 'stable' = 'stable'

    if (months.length >= 2) {
      const recent = sentimentByMonth[months[months.length - 1]]
      const earlier = sentimentByMonth[months[0]]

      const recentScore = recent.positive - recent.concern
      const earlierScore = earlier.positive - earlier.concern

      if (recentScore > earlierScore + 1) {
        sentimentTrend = 'improving'
      } else if (recentScore < earlierScore - 1) {
        sentimentTrend = 'declining'
      }
    }

    // Get theme names
    const themeIds = Array.from(themeMap.keys())
    let themeNames = new Map<string, string>()
    if (themeIds.length > 0) {
      const { data: themeData } = await adminClient
        .from("coaching_themes")
        .select("id, name")
        .in("id", themeIds)
      themeNames = new Map(themeData?.map(t => [t.id, t.name]) || [])
    }

    // Get player notes
    const { data: notes } = await supabase
      .from("player_notes")
      .select("id, note, category, created_at")
      .eq("user_id", user.id)
      .ilike("player_name", playerName)
      .order("created_at", { ascending: false })
      .limit(20)

    // Build response
    const response: PlayerAnalyticsResponse = {
      player_name: playerName.charAt(0).toUpperCase() + playerName.slice(1),
      total_mentions: playerInsights.length,
      sentiment_breakdown: sentimentBreakdown,
      sentiment_trend: sentimentTrend,
      first_mentioned: mentions.length > 0 ? mentions[mentions.length - 1].date : null,
      last_mentioned: mentions.length > 0 ? mentions[0].date : null,
      mentions: mentions.slice(0, 50), // Limit to last 50 mentions
      related_themes: Array.from(themeMap.entries())
        .map(([id, count]) => ({
          theme: themeNames.get(id) || id.replace(/_/g, ' '),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      notes: notes || [],
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Player analytics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch player analytics" },
      { status: 500 }
    )
  }
}
