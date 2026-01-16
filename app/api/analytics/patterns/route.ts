import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { LIMITS } from "@/lib/config"
import { hasClubAccess } from "@/lib/clubs"

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

interface AnalyticsResponse {
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

// GET /api/analytics/patterns?period=4w
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
    const rateLimit = await checkRateLimit(`analytics:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Get period from query params
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "4w"

    // Parse period (4w, 8w, 12w)
    const weeks = parseInt(period.replace("w", "")) || 4

    // Check subscription for analytics access
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single()

    const tier = profile?.subscription_tier || "free"

    // Check if user has club access
    const hasClub = await hasClubAccess(user.id)

    // Determine max allowed weeks based on tier
    let maxWeeks: number
    if (tier === "pro_plus" || hasClub) {
      maxWeeks = -1 // unlimited
    } else if (tier === "pro") {
      maxWeeks = LIMITS.PRO.analyticsWeeks
    } else {
      maxWeeks = LIMITS.FREE.analyticsWeeks
    }

    // Enforce limits
    const allowedWeeks = maxWeeks === -1 ? weeks : Math.min(weeks, maxWeeks)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (allowedWeeks * 7))

    const adminClient = createAdminClient()

    // Fetch extracted insights for the period
    const { data: insights } = await adminClient
      .from("extracted_insights")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false })

    // Fetch message count
    const { count: messageCount } = await adminClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", startDate.toISOString())

    // Fetch voice note count
    const { count: voiceNoteCount } = await adminClient
      .from("message_attachments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("attachment_type", "voice")
      .gte("created_at", startDate.toISOString())

    // Fetch session plan count
    const { count: sessionPlanCount } = await adminClient
      .from("message_attachments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("attachment_type", "image")
      .gte("created_at", startDate.toISOString())

    // Aggregate player mentions
    const playerMap = new Map<string, PlayerMention>()
    insights?.forEach(insight => {
      const players = insight.players_mentioned as Array<{
        name: string
        sentiment: 'positive' | 'concern' | 'neutral'
      }> || []

      players.forEach(player => {
        const existing = playerMap.get(player.name.toLowerCase()) || {
          name: player.name,
          count: 0,
          sentiment: { positive: 0, concern: 0, neutral: 0 }
        }
        existing.count++
        existing.sentiment[player.sentiment]++
        playerMap.set(player.name.toLowerCase(), existing)
      })
    })

    // Aggregate themes
    const themeMap = new Map<string, { count: number; totalConfidence: number }>()
    insights?.forEach(insight => {
      const themes = insight.themes as Array<{
        theme_id: string
        confidence: number
      }> || []

      themes.forEach(theme => {
        const existing = themeMap.get(theme.theme_id) || { count: 0, totalConfidence: 0 }
        existing.count++
        existing.totalConfidence += theme.confidence
        themeMap.set(theme.theme_id, existing)
      })
    })

    // Get theme names from coaching_themes table
    const { data: themeNames } = await adminClient
      .from("coaching_themes")
      .select("id, name")

    const themeNameMap = new Map(themeNames?.map(t => [t.id, t.name]) || [])

    // Build sentiment trend (daily)
    const sentimentByDate = new Map<string, { sentiment: string; energy: number | null; count: number }>()
    insights?.forEach(insight => {
      const date = insight.session_date || insight.created_at.split('T')[0]
      const existing = sentimentByDate.get(date) || { sentiment: 'neutral', energy: null, count: 0 }
      existing.sentiment = insight.overall_sentiment || 'neutral'
      if (insight.energy_level) {
        existing.energy = existing.energy
          ? (existing.energy + insight.energy_level) / 2
          : insight.energy_level
      }
      existing.count++
      sentimentByDate.set(date, existing)
    })

    // Count unique active days
    const activeDays = new Set<string>()
    insights?.forEach(insight => {
      activeDays.add(insight.created_at.split('T')[0])
    })

    // Build response
    const response: AnalyticsResponse = {
      period: `${allowedWeeks}w`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      summary: {
        total_messages: messageCount || 0,
        total_reflections: insights?.length || 0,
        total_voice_notes: voiceNoteCount || 0,
        total_session_plans: sessionPlanCount || 0,
        active_days: activeDays.size,
      },
      players: Array.from(playerMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      themes: Array.from(themeMap.entries())
        .map(([theme_id, data]) => ({
          theme_id,
          theme_name: themeNameMap.get(theme_id) || theme_id,
          count: data.count,
          avg_confidence: data.totalConfidence / data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      sentiment_trend: Array.from(sentimentByDate.entries())
        .map(([date, data]) => ({
          date,
          sentiment: data.sentiment,
          energy: data.energy,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      key_insights: generateKeyInsights(
        Array.from(playerMap.values()),
        Array.from(themeMap.entries()).map(([id, data]) => ({ id, ...data })),
        allowedWeeks
      ),
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

// Generate AI-like key insights from the data
function generateKeyInsights(
  players: PlayerMention[],
  themes: { id: string; count: number }[],
  weeks: number
): string[] {
  const insights: string[] = []

  // Most mentioned player
  if (players.length > 0) {
    const top = players[0]
    const sentimentWord = top.sentiment.positive > top.sentiment.concern
      ? "positively"
      : top.sentiment.concern > top.sentiment.positive
        ? "with concerns"
        : "regularly"
    insights.push(`You've mentioned ${top.name} ${top.count} times ${sentimentWord} over the last ${weeks} weeks.`)
  }

  // Top theme
  if (themes.length > 0) {
    const topTheme = themes[0]
    insights.push(`"${topTheme.id.replace('_', ' ')}" has been your most common coaching focus (${topTheme.count} mentions).`)
  }

  // Theme variety
  if (themes.length >= 3) {
    insights.push(`You're covering ${themes.length} different coaching themes - good balance!`)
  } else if (themes.length === 1) {
    insights.push("Consider diversifying your reflection topics to cover more areas of coaching.")
  }

  // Player concerns
  const concernPlayers = players.filter(p => p.sentiment.concern > p.sentiment.positive)
  if (concernPlayers.length > 0) {
    insights.push(`${concernPlayers.length} player(s) have more concerns than positives - might need extra attention.`)
  }

  return insights.slice(0, 4)
}
