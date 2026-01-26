import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { SPORT_NAMES, getSportTerminology } from "@/lib/chat-config"
import type { SessionPlanAnalysis } from "@/app/types"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

function getSessionPlanAnalysisPrompt(sport: string): string {
  const sportName = SPORT_NAMES[sport] || sport
  const terms = getSportTerminology(sport)

  return `You are analyzing a ${sportName} coaching session plan image. Extract all relevant information and return it as structured JSON.

Analyze this ${terms.session} plan image and extract:

1. **title**: The session title or topic if visible
2. **objectives**: List of session objectives/goals
3. **drills**: Array of ${terms.drill}s/activities, each with:
   - name: ${terms.drill.charAt(0).toUpperCase() + terms.drill.slice(1)} name
   - description: What ${terms.player}s do
   - duration_minutes: Time allocation if shown
   - setup: Equipment/space setup
   - coaching_points: Key things to coach
4. **total_duration_minutes**: Total session time if shown
5. **equipment_needed**: List of equipment mentioned
6. **age_group**: Target age group if mentioned
7. **player_count**: Number of ${terms.player}s if mentioned
8. **coaching_points**: General coaching points for the session
9. **image_type**: "handwritten", "digital", or "mixed"
10. **confidence_score**: 0-1 how confident you are in the extraction

If information is not visible or unclear, omit that field or use null.

Return ONLY valid JSON, no markdown formatting or explanation.`
}

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

    // Rate limiting
    const rateLimit = await checkRateLimit(`image-analyze:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait.", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Check subscription - image analysis is Pro only
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, sport")
      .eq("user_id", user.id)
      .single()

    const isSubscribed = profile?.subscription_tier !== "free"
    const userSport = profile?.sport || "football"

    if (!isSubscribed) {
      return NextResponse.json(
        { error: "Image analysis is a Pro feature. Please upgrade to continue." },
        { status: 402 }
      )
    }

    const body = await request.json()
    const { attachment_id } = body

    if (!attachment_id) {
      return NextResponse.json(
        { error: "attachment_id is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get the attachment record
    const { data: attachment, error: attachmentError } = await adminClient
      .from("message_attachments")
      .select("*")
      .eq("id", attachment_id)
      .eq("user_id", user.id)
      .single()

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      )
    }

    if (attachment.attachment_type !== "image") {
      return NextResponse.json(
        { error: "Attachment is not an image" },
        { status: 400 }
      )
    }

    // Update status to processing
    await adminClient
      .from("message_attachments")
      .update({ processing_status: "processing" })
      .eq("id", attachment_id)

    try {
      // Get public URL from storage path
      const { data: { publicUrl } } = adminClient
        .storage
        .from("session-plans")
        .getPublicUrl(attachment.storage_path)

      // Fetch the image
      const imageResponse = await fetch(publicUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')

      // Map mime type to Gemini format
      const mimeType = attachment.mime_type as string

      // Analyze with Gemini Vision
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        { text: getSessionPlanAnalysisPrompt(userSport) },
      ])

      const response = result.response
      const textContent = response.text()

      if (!textContent) {
        throw new Error("No text response from Gemini")
      }

      // Parse JSON response
      let analysis: SessionPlanAnalysis
      try {
        let jsonText = textContent.trim()
        // Remove markdown code blocks if present
        if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
        if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
        if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
        analysis = JSON.parse(jsonText.trim())
      } catch {
        throw new Error("Failed to parse session plan analysis")
      }

      // Update attachment with analysis
      await adminClient
        .from("message_attachments")
        .update({
          processing_status: "completed",
          image_analysis: analysis,
        })
        .eq("id", attachment_id)

      return NextResponse.json({
        analysis,
        attachment_id,
      })

    } catch (analysisError) {
      // Update status to failed
      const errorMessage = analysisError instanceof Error ? analysisError.message : "Unknown error"
      await adminClient
        .from("message_attachments")
        .update({
          processing_status: "failed",
          processing_error: errorMessage,
        })
        .eq("id", attachment_id)

      return NextResponse.json(
        { error: `Failed to analyze image: ${errorMessage}` },
        { status: 500 }
      )
    }

  } catch (err) {
    return NextResponse.json(
      { error: `Failed to analyze image: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
