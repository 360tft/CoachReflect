import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import type { SessionPlanAnalysis, SessionDrill } from "@/app/types"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ANALYSIS_PROMPT = `You are analyzing a football/soccer coaching session plan image. Extract the following information from the image:

1. Session title or topic
2. Objectives (what the coach wants to achieve)
3. Drills/activities with:
   - Name
   - Duration (in minutes if visible)
   - Description
   - Key coaching points
4. Equipment needed
5. Total session duration

The plan may be handwritten or digital. Do your best to interpret even if handwriting is messy.

Return your response as valid JSON in this exact format:
{
  "title": "string or null",
  "objectives": ["array", "of", "objectives"],
  "drills": [
    {
      "name": "drill name",
      "description": "what the drill involves",
      "duration_minutes": number or null,
      "setup": "how to set it up",
      "coaching_focus": "key coaching points"
    }
  ],
  "coaching_points": ["key", "coaching", "points"],
  "equipment_needed": ["cones", "balls", "etc"],
  "total_duration_minutes": number or null,
  "image_type": "handwritten" | "digital" | "mixed",
  "confidence_score": 0.0 to 1.0
}

If you cannot read parts of the image, still extract what you can and set confidence_score lower.
Return ONLY the JSON object, no other text.`

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single()

    if (profile?.subscription_tier === "free") {
      return NextResponse.json(
        { error: "Session plan analysis requires a Pro subscription" },
        { status: 403 }
      )
    }

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    // Extract base64 data and media type
    const base64Match = image.match(/^data:image\/([\w+]+);base64,(.+)$/)
    if (!base64Match) {
      return NextResponse.json(
        { error: "Invalid image format. Please provide a base64 encoded image." },
        { status: 400 }
      )
    }

    const mediaType = `image/${base64Match[1]}` as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
    const base64Data = base64Match[2]

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    })

    // Extract text content
    const textContent = response.content.find((block) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "Failed to analyze image" },
        { status: 500 }
      )
    }

    // Parse JSON response
    let analysis: SessionPlanAnalysis
    try {
      // Clean up the response in case there's markdown formatting
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

      const parsed = JSON.parse(jsonText.trim())

      analysis = {
        title: parsed.title || null,
        objectives: parsed.objectives || [],
        drills: (parsed.drills || []).map((drill: SessionDrill) => ({
          name: drill.name || "Unnamed Drill",
          description: drill.description || null,
          duration_minutes: drill.duration_minutes || null,
          setup: drill.setup || null,
          coaching_focus: drill.coaching_focus || null,
        })),
        coaching_points: parsed.coaching_points || [],
        equipment_needed: parsed.equipment_needed || [],
        total_duration_minutes: parsed.total_duration_minutes || null,
        image_type: parsed.image_type || "mixed",
        confidence_score: parsed.confidence_score || 0.5,
        raw_extraction: textContent.text,
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse analysis results" },
        { status: 500 }
      )
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Session plan analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze session plan" },
      { status: 500 }
    )
  }
}
