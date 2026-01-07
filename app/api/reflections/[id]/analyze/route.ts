import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ANALYSIS_PROMPT = `You are a supportive football coaching expert analyzing a coach's post-session reflection.

Based on the reflection content provided, generate:

1. A concise summary (2-3 sentences) that captures the key takeaways from the session
2. 2-4 insights - observations, patterns, or suggestions based on what the coach shared
3. 2-3 specific, actionable items the coach can work on

Be supportive and constructive. Focus on growth opportunities without being critical.
Speak directly to the coach using "you" language.

Return your response as valid JSON in this exact format:
{
  "summary": "A concise 2-3 sentence summary of the session...",
  "insights": [
    "First insight or observation...",
    "Second insight or pattern noticed...",
    "Third insight or suggestion..."
  ],
  "action_items": [
    "First specific action to take...",
    "Second actionable improvement...",
    "Third next step..."
  ]
}

Return ONLY the JSON object, no other text.`

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single()

    if (profile?.subscription_tier === "free") {
      return NextResponse.json(
        { error: "AI analysis requires a Pro subscription" },
        { status: 403 }
      )
    }

    // Get the reflection
    const { data: reflection, error: fetchError } = await supabase
      .from("reflections")
      .select("*, sessions(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !reflection) {
      return NextResponse.json({ error: "Reflection not found" }, { status: 404 })
    }

    // Build context for AI
    const context = `
Session: ${reflection.sessions?.title || "Untitled"} (${reflection.sessions?.session_type || "training"})
Date: ${reflection.date}

What worked well:
${reflection.what_worked || "Not provided"}

What didn't go as planned:
${reflection.what_didnt_work || "Not provided"}

Player standouts:
${reflection.player_standouts || "Not provided"}

Areas to improve:
${reflection.areas_to_improve || "Not provided"}

Focus for next session:
${reflection.next_focus || "Not provided"}

Mood: ${reflection.mood_rating}/5
Energy: ${reflection.energy_rating}/5
`

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${ANALYSIS_PROMPT}\n\nReflection to analyze:\n${context}`,
        },
      ],
    })

    // Extract text content
    const textContent = response.content.find((block) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "Failed to generate analysis" },
        { status: 500 }
      )
    }

    // Parse JSON response
    let analysis
    try {
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7)
      }
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3)
      }

      analysis = JSON.parse(jsonText.trim())
    } catch {
      return NextResponse.json(
        { error: "Failed to parse analysis" },
        { status: 500 }
      )
    }

    // Update reflection with AI analysis
    const { error: updateError } = await supabase
      .from("reflections")
      .update({
        ai_summary: analysis.summary,
        ai_insights: analysis.insights.join("\n"),
        ai_action_items: analysis.action_items,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error saving analysis:", updateError)
    }

    return NextResponse.json({
      summary: analysis.summary,
      insights: analysis.insights,
      action_items: analysis.action_items,
    })
  } catch (error) {
    console.error("Error analyzing reflection:", error)
    return NextResponse.json(
      { error: "Failed to analyze reflection" },
      { status: 500 }
    )
  }
}
