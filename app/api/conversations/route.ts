import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/conversations - Fetch user's conversations
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching conversations:", error)
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversations })

  } catch (error) {
    console.error("Conversations API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}
