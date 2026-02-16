import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

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

    // Check subscription and trial status
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, pro_trial_used")
      .eq("user_id", user.id)
      .single()

    const isProTrial = request.headers.get('X-Pro-Trial') === 'true'

    if (profile?.subscription_tier === "free") {
      // If it's a trial request and trial hasn't been used, allow it
      if (isProTrial && !profile?.pro_trial_used) {
        // Trial will be marked as used by the /api/pro-trial endpoint
        // which is called before this endpoint
      } else {
        return NextResponse.json(
          { error: "AI analysis requires a Pro subscription" },
          { status: 403 }
        )
      }
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

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(`${ANALYSIS_PROMPT}\n\nReflection to analyze:\n${context}`)
    const response = result.response
    const textContent = response.text()

    if (!textContent) {
      return NextResponse.json(
        { error: "Failed to generate analysis" },
        { status: 500 }
      )
    }

    // Parse JSON response
    let analysis
    try {
      let jsonText = textContent.trim()
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

    // Create tasks from action items (prevent duplicates for this reflection)
    if (analysis.action_items?.length > 0) {
      const adminClient = createAdminClient()

      // Check if tasks already exist for this reflection
      const { count } = await adminClient
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("reflection_id", id)
        .eq("user_id", user.id)

      if (!count || count === 0) {
        const taskRows = analysis.action_items.map((item: string) => ({
          user_id: user.id,
          title: item,
          source: "ai_reflection",
          reflection_id: id,
          priority: "medium",
        }))
        await adminClient.from("tasks").insert(taskRows)
      }
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
