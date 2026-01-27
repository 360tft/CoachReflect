import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { notifyNegativeFeedback } from "@/lib/email-sender"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, RATE_LIMITS.API)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const {
      reflection_id,
      conversation_id,
      content_type,
      content_text,
      rating,
      feedback_text
    } = body

    // Validate required fields
    if (!content_type || !content_text || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: content_type, content_text, rating" },
        { status: 400 }
      )
    }

    // Validate rating
    if (!["positive", "negative"].includes(rating)) {
      return NextResponse.json(
        { error: "Rating must be 'positive' or 'negative'" },
        { status: 400 }
      )
    }

    // Validate content_type
    if (!["ai_summary", "ai_insight", "chat_response"].includes(content_type)) {
      return NextResponse.json(
        { error: "Invalid content_type" },
        { status: 400 }
      )
    }

    // Insert feedback
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        user_id: user.id,
        reflection_id: reflection_id || null,
        conversation_id: conversation_id || null,
        content_type,
        content_text: content_text.slice(0, 5000), // Limit stored content
        rating,
        feedback_text: feedback_text?.slice(0, 1000) || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Feedback insert error:", error)
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      )
    }

    // Notify admin on negative feedback
    if (rating === "negative") {
      notifyNegativeFeedback(
        user.email,
        content_text || "",
        "",
        feedback_text,
        content_type
      ).catch(console.error)
    }

    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error("Feedback API error:", error)
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    )
  }
}
