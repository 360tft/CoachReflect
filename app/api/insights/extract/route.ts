import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { SPORT_NAMES, getSportTerminology } from "@/lib/chat-config"
import { updateStreak } from "@/lib/gamification"
import { sendStreakMilestoneEmail } from "@/lib/email-sender"
import { isStreakMilestone } from "@/lib/email-sequences"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

// Default coaching themes to look for (applicable to all sports)
const COACHING_THEMES = [
  'discipline', 'motivation', 'technique', 'tactical', 'physical',
  'communication', 'teamwork', 'confidence', 'session_planning',
  'player_development', 'game_management', 'parent_management'
]

function getExtractionPrompt(sport: string, conversation: string): string {
  const sportName = SPORT_NAMES[sport] || sport
  const terms = getSportTerminology(sport)

  return `Analyze this ${sportName} coaching reflection conversation and extract structured data.

CONVERSATION:
${conversation}

Extract and return a JSON object with these exact fields:
{
  "mood_rating": <number 1-5, or null if not mentioned>,
  "energy_rating": <number 1-5, or null if not mentioned>,
  "what_worked": <string summary of what went well, or null>,
  "what_didnt_work": <string summary of challenges/issues, or null>,
  "player_standouts": <string about ${terms.player}s mentioned, or null>,
  "next_focus": <string about what they'll focus on next, or null>,
  "ai_summary": <2-3 sentence summary of the reflection>,
  "players_mentioned": [
    { "name": "string", "context": "positive|concern|neutral", "snippet": "brief quote" }
  ],
  "themes": ${JSON.stringify(COACHING_THEMES)},
  "exercises_drills": ["${terms.drill}1", "${terms.drill}2"],
  "overall_sentiment": "positive|negative|mixed|neutral"
}

For mood_rating and energy_rating:
- 5 = Great/High
- 4 = Good
- 3 = Okay/Medium
- 2 = Tough/Low
- 1 = Drained/Empty

For themes, only include those that are actually present in the conversation.
Only include data that was explicitly discussed. Don't invent details.
Return ONLY valid JSON, no markdown formatting.`
}

export interface ExtractedData {
  mood_rating: number | null
  energy_rating: number | null
  what_worked: string | null
  what_didnt_work: string | null
  player_standouts: string | null
  next_focus: string | null
  ai_summary: string | null
  players_mentioned: {
    name: string
    context: 'positive' | 'concern' | 'neutral'
    snippet: string
  }[]
  themes: string[]
  exercises_drills: string[]
  overall_sentiment: 'positive' | 'negative' | 'mixed' | 'neutral'
}

// POST /api/insights/extract - Extract insights from a reflection conversation
export async function POST(request: Request) {
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
    const rateLimit = await checkRateLimit(`insights:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, sport")
      .eq("user_id", user.id)
      .single()

    const userSport = profile?.sport || "football"

    const body = await request.json()
    const { conversationId, createReflection = true } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get conversation messages
    const { data: messages, error: msgError } = await adminClient
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (msgError || !messages || messages.length < 2) {
      return NextResponse.json(
        { error: "Conversation not found or too short for extraction" },
        { status: 404 }
      )
    }

    // Build conversation text for analysis
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'Coach' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    // Use AI to extract structured data
    const prompt = getExtractionPrompt(userSport, conversationText)

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(prompt)
    const response = result.response
    const textContent = response.text()

    if (!textContent) {
      return NextResponse.json(
        { error: "Failed to extract data" },
        { status: 500 }
      )
    }

    // Parse extracted data
    let extracted: ExtractedData
    try {
      let jsonText = textContent.trim()
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
      if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
      if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
      extracted = JSON.parse(jsonText.trim())
    } catch {
      // Error logged:("Failed to parse extraction:", textContent)
      return NextResponse.json(
        { error: "Failed to parse extracted data" },
        { status: 500 }
      )
    }

    const sessionDate = new Date().toISOString().split('T')[0]
    let reflectionId: string | null = null

    // Create reflection record if requested
    if (createReflection) {
      const { data: reflection, error: reflectionError } = await adminClient
        .from("reflections")
        .insert({
          user_id: user.id,
          date: sessionDate,
          mood_rating: extracted.mood_rating || null,
          energy_rating: extracted.energy_rating || null,
          what_worked: extracted.what_worked || null,
          what_didnt_work: extracted.what_didnt_work || null,
          player_standouts: extracted.player_standouts || null,
          next_focus: extracted.next_focus || null,
          ai_summary: extracted.ai_summary || null,
          ai_insights: `Themes: ${(extracted.themes || []).join(', ')}. Sentiment: ${extracted.overall_sentiment || 'neutral'}`,
          ai_action_items: [],
          tags: extracted.themes || [],
        })
        .select()
        .single()

      if (reflectionError) {
        // Error logged:("Error creating reflection:", reflectionError)
      } else {
        reflectionId = reflection.id
      }

      // Update profile reflection count
      const currentMonth = new Date().toISOString().slice(0, 7)
      await adminClient
        .from("profiles")
        .update({
          reflections_this_month: (profile?.subscription_tier === 'free' ? 1 : 0),
          reflection_count_period: currentMonth
        })
        .eq("user_id", user.id)
    }

    // Insert extracted insights for players
    if (extracted.players_mentioned?.length > 0) {
      const playerInsights = extracted.players_mentioned.map((p) => ({
        user_id: user.id,
        conversation_id: conversationId,
        insight_type: 'player_mention',
        name: p.name,
        context: p.context || 'neutral',
        snippet: p.snippet || null,
        session_date: sessionDate,
      }))

      await adminClient.from("extracted_insights").insert(playerInsights)
    }

    // Insert extracted insights for themes
    if (extracted.themes?.length > 0) {
      const themeInsights = extracted.themes.map((theme) => ({
        user_id: user.id,
        conversation_id: conversationId,
        insight_type: 'theme',
        name: theme,
        context: extracted.overall_sentiment || 'neutral',
        session_date: sessionDate,
      }))

      await adminClient.from("extracted_insights").insert(themeInsights)
    }

    // Insert extracted insights for exercises/drills
    if (extracted.exercises_drills?.length > 0) {
      const exerciseInsights = extracted.exercises_drills.map((exercise) => ({
        user_id: user.id,
        conversation_id: conversationId,
        insight_type: 'exercise',
        name: exercise,
        context: 'neutral',
        session_date: sessionDate,
      }))

      await adminClient.from("extracted_insights").insert(exerciseInsights)
    }

    // Insert overall sentiment
    await adminClient.from("extracted_insights").insert({
      user_id: user.id,
      conversation_id: conversationId,
      insight_type: 'sentiment',
      name: extracted.overall_sentiment || 'neutral',
      context: extracted.overall_sentiment || 'neutral',
      session_date: sessionDate,
    })

    // Update coach daily stats
    await updateDailyStats(adminClient, user.id, sessionDate, extracted)

    // Update streak and send milestone email if applicable
    try {
      const streakResult = await updateStreak(user.id)
      if (streakResult.isNewDay && streakResult.isStreakMilestone) {
        const streak = streakResult.streak
        if (isStreakMilestone(streak)) {
          const { data: userProfile } = await adminClient
            .from("profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .single()

          await sendStreakMilestoneEmail(
            user.email!,
            streak as 3 | 7 | 14 | 30,
            { name: userProfile?.display_name || "Coach", userId: user.id }
          )
        }
      }
    } catch {
      // Streak update is non-critical - don't fail the extraction
    }

    return NextResponse.json({
      success: true,
      reflection_id: reflectionId,
      extracted: {
        mood_rating: extracted.mood_rating,
        energy_rating: extracted.energy_rating,
        players_mentioned: extracted.players_mentioned?.length || 0,
        themes: extracted.themes?.length || 0,
        sentiment: extracted.overall_sentiment,
        ai_summary: extracted.ai_summary,
      }
    })

  } catch (error) {
    // Error logged:("Extraction API error:", error)
    return NextResponse.json(
      { error: "Failed to extract reflection data" },
      { status: 500 }
    )
  }
}

// Helper to update daily stats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateDailyStats(adminClient: any, userId: string, date: string, extracted: ExtractedData) {
  try {
    // Check if stats exist for today
    const { data: existingStats } = await adminClient
      .from("coach_daily_stats")
      .select("*")
      .eq("user_id", userId)
      .eq("stat_date", date)
      .single()

    if (existingStats) {
      // Update existing stats
      await adminClient
        .from("coach_daily_stats")
        .update({
          reflections_created: existingStats.reflections_created + 1,
          unique_players_mentioned: existingStats.unique_players_mentioned + (extracted.players_mentioned?.length || 0),
          unique_themes: existingStats.unique_themes + (extracted.themes?.length || 0),
          avg_mood: extracted.mood_rating || existingStats.avg_mood,
          avg_energy: extracted.energy_rating || existingStats.avg_energy,
          positive_mentions: existingStats.positive_mentions + (extracted.players_mentioned?.filter((p) => p.context === 'positive')?.length || 0),
          concern_mentions: existingStats.concern_mentions + (extracted.players_mentioned?.filter((p) => p.context === 'concern')?.length || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("stat_date", date)
    } else {
      // Create new stats record
      await adminClient
        .from("coach_daily_stats")
        .insert({
          user_id: userId,
          stat_date: date,
          reflections_created: 1,
          unique_players_mentioned: extracted.players_mentioned?.length || 0,
          unique_themes: extracted.themes?.length || 0,
          avg_mood: extracted.mood_rating || null,
          avg_energy: extracted.energy_rating || null,
          positive_mentions: extracted.players_mentioned?.filter((p) => p.context === 'positive')?.length || 0,
          concern_mentions: extracted.players_mentioned?.filter((p) => p.context === 'concern')?.length || 0,
        })
    }
  } catch (error) {
    // Error logged:("Failed to update daily stats:", error)
  }
}

// Background extraction function - can be called after chat messages
export async function extractInsightsBackground(
  userId: string,
  conversationId: string,
  conversationText: string,
  sport: string = 'football'
): Promise<void> {
  try {
    const prompt = getExtractionPrompt(sport, conversationText)

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(prompt)
    const response = result.response
    const textContent = response.text()

    if (!textContent) return

    let extracted: ExtractedData
    try {
      let jsonText = textContent.trim()
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
      if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
      if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
      extracted = JSON.parse(jsonText.trim())
    } catch {
      // Error logged:("Background extraction parse failed")
      return
    }

    // Only store if there's meaningful content
    const hasContent =
      extracted.players_mentioned?.length > 0 ||
      extracted.themes?.length > 0 ||
      extracted.exercises_drills?.length > 0

    if (!hasContent) return

    const adminClient = createAdminClient()
    const sessionDate = new Date().toISOString().split('T')[0]

    // Insert player mentions
    if (extracted.players_mentioned?.length > 0) {
      await adminClient.from("extracted_insights").insert(
        extracted.players_mentioned.map(p => ({
          user_id: userId,
          conversation_id: conversationId,
          insight_type: 'player_mention',
          name: p.name,
          context: p.context || 'neutral',
          snippet: p.snippet || null,
          session_date: sessionDate,
        }))
      )
    }

    // Insert themes
    if (extracted.themes?.length > 0) {
      await adminClient.from("extracted_insights").insert(
        extracted.themes.map(theme => ({
          user_id: userId,
          conversation_id: conversationId,
          insight_type: 'theme',
          name: theme,
          context: extracted.overall_sentiment || 'neutral',
          session_date: sessionDate,
        }))
      )
    }

    // Insert exercises
    if (extracted.exercises_drills?.length > 0) {
      await adminClient.from("extracted_insights").insert(
        extracted.exercises_drills.map(exercise => ({
          user_id: userId,
          conversation_id: conversationId,
          insight_type: 'exercise',
          name: exercise,
          context: 'neutral',
          session_date: sessionDate,
        }))
      )
    }

  } catch (error) {
    // Error logged:("Background insight extraction failed:", error)
  }
}
