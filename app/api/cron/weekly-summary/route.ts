import { NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { renderTemplate } from "@/lib/email-templates"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Coach Reflection <hello@coachreflection.com>'
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || 'admin@360tft.com'

// Helper to add delay between sends (rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface PlayerMention {
  name: string
  count: number
  sentiment: 'positive' | 'concern' | 'neutral'
}

interface ThemeMention {
  name: string
  count: number
}

// GET /api/cron/weekly-summary
// Run every Sunday/Monday morning to send weekly summaries
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check required config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 })
  }

  if (!resendApiKey) {
    return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const resend = new Resend(resendApiKey)

  // Calculate week dates (last 7 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const weekStartDate = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const weekEndDate = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  // Get all active users who have opted in to weekly emails
  // and haven't unsubscribed from emails
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, weekly_summary_enabled")
    .eq("email_notifications_enabled", true)
    .eq("email_unsubscribed", false)
    .or("weekly_summary_enabled.is.null,weekly_summary_enabled.eq.true")
    .limit(500)

  if (profileError) {
    console.error("[Weekly Summary] Error fetching profiles:", profileError)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  let sent = 0
  let errors = 0
  let skipped = 0
  const results: { email: string; status: string; error?: string }[] = []

  // Process each user
  for (const profile of profiles || []) {
    // Get user details
    const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id)
    const user = userData?.user

    if (!user?.email) {
      console.error(`[Weekly Summary] No email for user ${profile.user_id}`)
      skipped++
      continue
    }

    // Gather user's weekly stats
    const stats = await gatherWeeklyStats(supabase, profile.user_id, startDate)

    // Skip if user had no activity and hasn't been active recently
    // (Don't spam completely inactive users)
    const { data: lastActivity } = await supabase
      .from("messages")
      .select("created_at")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!stats.hasActivity) {
      const lastActiveDate = lastActivity?.created_at ? new Date(lastActivity.created_at) : null
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Skip if no activity in last 30 days
      if (!lastActiveDate || lastActiveDate < thirtyDaysAgo) {
        skipped++
        continue
      }
    }

    // Get streak info
    const { data: streakData } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", profile.user_id)
      .single()

    const userName = user.user_metadata?.display_name || user.email.split("@")[0] || "Coach"

    // Render the weekly summary template
    const html = renderTemplate('weekly-summary', {
      name: userName,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?user=${profile.user_id}`,
      weeklySummary: {
        reflectionCount: stats.reflectionCount,
        messageCount: stats.messageCount,
        voiceNoteCount: stats.voiceNoteCount,
        sessionPlanCount: stats.sessionPlanCount,
        topPlayers: stats.topPlayers,
        topThemes: stats.topThemes,
        streakDays: streakData?.current_streak || 0,
        keyInsight: stats.keyInsight,
        weekStartDate,
        weekEndDate,
      },
    })

    if (!html) {
      console.error("[Weekly Summary] Failed to render template")
      errors++
      continue
    }

    // Send email
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL,
        to: user.email,
        subject: "Your Week in Coaching",
        html,
      })

      // Log the sent email
      await supabase.from("email_log").insert({
        user_id: profile.user_id,
        email_type: "weekly_summary",
        subject: "Your Week in Coaching",
      })

      sent++
      results.push({ email: user.email, status: "sent" })

      // Rate limit: 100ms between sends
      await delay(100)

    } catch (error) {
      console.error(`[Weekly Summary] Failed to send to ${user.email}:`, error)

      // Log the error
      await supabase.from("email_log").insert({
        user_id: profile.user_id,
        email_type: "weekly_summary",
        subject: "Your Week in Coaching",
        error: String(error),
      })

      errors++
      results.push({ email: user.email, status: "error", error: String(error) })
    }
  }

  console.log(`[Weekly Summary] Sent: ${sent}, Errors: ${errors}, Skipped: ${skipped}`)

  return NextResponse.json({
    processed: profiles?.length || 0,
    sent,
    errors,
    skipped,
    results,
  })
}

// Gather weekly stats for a user
async function gatherWeeklyStats(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date
): Promise<{
  hasActivity: boolean
  reflectionCount: number
  messageCount: number
  voiceNoteCount: number
  sessionPlanCount: number
  topPlayers: PlayerMention[]
  topThemes: ThemeMention[]
  keyInsight?: string
}> {
  const startIso = startDate.toISOString()

  // Count messages this week
  const { count: messageCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startIso)

  // Count voice notes this week
  const { count: voiceNoteCount } = await supabase
    .from("message_attachments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("attachment_type", "voice")
    .gte("created_at", startIso)

  // Count session plans this week
  const { count: sessionPlanCount } = await supabase
    .from("message_attachments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("attachment_type", "image")
    .gte("created_at", startIso)

  // Get extracted insights for player/theme aggregation
  const { data: insights } = await supabase
    .from("extracted_insights")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startIso)

  // Aggregate players
  const playerMap = new Map<string, { count: number; positive: number; concern: number; neutral: number }>()
  insights?.forEach(insight => {
    const players = insight.players_mentioned as Array<{
      name: string
      sentiment: 'positive' | 'concern' | 'neutral'
    }> || []

    players.forEach(player => {
      const key = player.name.toLowerCase()
      const existing = playerMap.get(key) || { count: 0, positive: 0, concern: 0, neutral: 0 }
      existing.count++
      existing[player.sentiment]++
      playerMap.set(key, existing)
    })
  })

  const topPlayers: PlayerMention[] = Array.from(playerMap.entries())
    .map(([name, data]) => {
      // Determine dominant sentiment
      let sentiment: 'positive' | 'concern' | 'neutral' = 'neutral'
      if (data.positive > data.concern && data.positive > data.neutral) {
        sentiment = 'positive'
      } else if (data.concern > data.positive && data.concern > data.neutral) {
        sentiment = 'concern'
      }
      return { name: name.charAt(0).toUpperCase() + name.slice(1), count: data.count, sentiment }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Aggregate themes
  const themeMap = new Map<string, number>()
  insights?.forEach(insight => {
    const themes = insight.themes as Array<{ theme_id: string }> || []
    themes.forEach(theme => {
      const count = themeMap.get(theme.theme_id) || 0
      themeMap.set(theme.theme_id, count + 1)
    })
  })

  // Get theme names
  const themeIds = Array.from(themeMap.keys())
  let themeNames = new Map<string, string>()
  if (themeIds.length > 0) {
    const { data: themeData } = await supabase
      .from("coaching_themes")
      .select("id, name")
      .in("id", themeIds)
    themeNames = new Map(themeData?.map(t => [t.id, t.name]) || [])
  }

  const topThemes: ThemeMention[] = Array.from(themeMap.entries())
    .map(([id, count]) => ({
      name: themeNames.get(id) || id.replace(/_/g, ' '),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Generate a key insight
  let keyInsight: string | undefined
  if (topPlayers.length > 0) {
    const player = topPlayers[0]
    if (player.sentiment === 'concern') {
      keyInsight = `${player.name} has been mentioned ${player.count} times with concerns this week. Consider checking in with them.`
    } else if (player.sentiment === 'positive') {
      keyInsight = `${player.name} has been mentioned ${player.count} times positively this week. Great progress!`
    }
  } else if (topThemes.length > 0) {
    keyInsight = `Your top focus this week was "${topThemes[0].name}" with ${topThemes[0].count} mentions.`
  }

  const reflectionCount = insights?.length || 0
  const hasActivity = (messageCount || 0) > 0 || reflectionCount > 0

  return {
    hasActivity,
    reflectionCount,
    messageCount: messageCount || 0,
    voiceNoteCount: voiceNoteCount || 0,
    sessionPlanCount: sessionPlanCount || 0,
    topPlayers,
    topThemes,
    keyInsight,
  }
}
