import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { SPORT_NAMES, getSportTerminology } from "@/lib/chat-config"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Default coaching themes to look for (applicable to all sports)
const COACHING_THEMES = [
  'discipline', 'motivation', 'technique', 'tactical', 'physical',
  'communication', 'teamwork', 'confidence', 'session_planning',
  'player_development', 'game_management', 'parent_management'
]

function getExtractionPrompt(sport: string, conversation: string): string {
  const sportName = SPORT_NAMES[sport] || sport
  const terms = getSportTerminology(sport)

  return `Analyze this ${sportName} coaching conversation and extract structured information about the coaching session.

Conversation:
${conversation}

Extract and return a JSON object with:

1. "${terms.player}s_mentioned": Array of ${terms.player}s mentioned with context:
   - "name": ${terms.player.charAt(0).toUpperCase() + terms.player.slice(1)}'s name/identifier
   - "context": What was said about them (brief)
   - "sentiment": "positive", "concern", or "neutral"

2. "themes": Array of coaching themes present (from this list: ${COACHING_THEMES.join(', ')}):
   - "theme_id": The theme identifier
   - "confidence": 0-1 how strongly this theme is present
   - "snippet": Brief quote that shows this theme

3. "exercises": Array of ${terms.drill}s/exercises mentioned:
   - "name": ${terms.drill.charAt(0).toUpperCase() + terms.drill.slice(1)} name
   - "context": How it was used or what happened

4. "overall_sentiment": "positive", "neutral", "negative", or "mixed"

5. "energy_level": 1-5 based on the coach's described energy/mood (if mentioned)

6. "key_insights": 1-3 main takeaways from this reflection

Note: Return players_mentioned as the key regardless of sport terminology.
Only include information that is actually present. Don't invent details.
Return ONLY valid JSON, no explanation.`
}

export interface ExtractedInsight {
  players_mentioned: {
    name: string
    context: string
    sentiment: 'positive' | 'concern' | 'neutral'
  }[]
  themes: {
    theme_id: string
    confidence: number
    snippet: string
  }[]
  exercises: {
    name: string
    context: string
  }[]
  overall_sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  energy_level: number | null
  key_insights: string[]
}

// POST /api/insights/extract - Extract insights from conversation
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

    // Check subscription - theme extraction is Pro only
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, sport")
      .eq("user_id", user.id)
      .single()

    const isSubscribed = profile?.subscription_tier !== "free"
    const userSport = profile?.sport || "football"

    if (!isSubscribed) {
      return NextResponse.json(
        { error: "Theme extraction is a Pro feature" },
        { status: 402 }
      )
    }

    const body = await request.json()
    const { conversation_id, message_id, conversation_text, session_date } = body

    if (!conversation_text) {
      return NextResponse.json(
        { error: "conversation_text is required" },
        { status: 400 }
      )
    }

    // Build the extraction prompt with sport-specific terminology
    const prompt = getExtractionPrompt(userSport, conversation_text)

    // Call Claude for extraction
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const textContent = response.content.find(b => b.type === "text")
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "Failed to extract insights" },
        { status: 500 }
      )
    }

    // Parse the response
    let extracted: ExtractedInsight
    try {
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
      if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
      if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
      extracted = JSON.parse(jsonText.trim())
    } catch {
      console.error("Failed to parse extraction response:", textContent.text)
      return NextResponse.json(
        { error: "Failed to parse extraction results" },
        { status: 500 }
      )
    }

    // Store the extracted insights
    const adminClient = createAdminClient()

    const { data: insight, error: insertError } = await adminClient
      .from("extracted_insights")
      .insert({
        user_id: user.id,
        conversation_id: conversation_id || null,
        message_id: message_id || null,
        players_mentioned: extracted.players_mentioned || [],
        themes: extracted.themes || [],
        exercises: extracted.exercises || [],
        overall_sentiment: extracted.overall_sentiment || 'neutral',
        energy_level: extracted.energy_level || null,
        session_date: session_date || new Date().toISOString().split('T')[0],
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Failed to store insights:", insertError)
      // Still return the extraction even if storage fails
    }

    return NextResponse.json({
      success: true,
      insight_id: insight?.id,
      extraction: extracted,
    })

  } catch (error) {
    console.error("Insight extraction error:", error)
    return NextResponse.json(
      { error: "Failed to extract insights" },
      { status: 500 }
    )
  }
}

// Background extraction function (called after chat messages)
export async function extractInsightsBackground(
  userId: string,
  conversationId: string,
  messageId: string,
  conversationText: string,
  sport: string = 'football'
): Promise<void> {
  try {
    const prompt = getExtractionPrompt(sport, conversationText)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const textContent = response.content.find(b => b.type === "text")
    if (!textContent || textContent.type !== "text") return

    let extracted: ExtractedInsight
    try {
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
      if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
      if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
      extracted = JSON.parse(jsonText.trim())
    } catch {
      console.error("Background extraction parse failed")
      return
    }

    // Only store if there's meaningful content
    const hasContent =
      extracted.players_mentioned?.length > 0 ||
      extracted.themes?.length > 0 ||
      extracted.exercises?.length > 0 ||
      extracted.key_insights?.length > 0

    if (!hasContent) return

    const adminClient = createAdminClient()

    await adminClient
      .from("extracted_insights")
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        message_id: messageId,
        players_mentioned: extracted.players_mentioned || [],
        themes: extracted.themes || [],
        exercises: extracted.exercises || [],
        overall_sentiment: extracted.overall_sentiment || 'neutral',
        energy_level: extracted.energy_level || null,
        session_date: new Date().toISOString().split('T')[0],
      })

  } catch (error) {
    console.error("Background insight extraction failed:", error)
  }
}
