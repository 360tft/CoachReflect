import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PATCH /api/account/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Whitelist allowed fields
    const allowedFields = [
      'weekly_summary_enabled',
      'email_notifications_enabled',
    ]

    const updates: Record<string, boolean> = {}
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === 'boolean') {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)

    if (error) {
      console.error("Failed to update preferences:", error)
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, updated: updates })

  } catch (error) {
    console.error("Preferences update error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}

// GET /api/account/preferences - Get user preferences
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("weekly_summary_enabled, email_notifications_enabled")
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Failed to fetch preferences:", error)
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      weekly_summary_enabled: profile?.weekly_summary_enabled ?? true,
      email_notifications_enabled: profile?.email_notifications_enabled ?? true,
    })

  } catch (error) {
    console.error("Preferences fetch error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
