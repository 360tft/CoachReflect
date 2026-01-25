import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

// POST /api/player-notes - Create a new player note
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`player-notes:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { player_name, note, category, source_type, source_id } = body

    if (!player_name || !note) {
      return NextResponse.json(
        { error: "player_name and note are required" },
        { status: 400 }
      )
    }

    const validCategories = ['strength', 'development', 'concern', 'goal', 'general']
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("player_notes")
      .insert({
        user_id: user.id,
        player_name: player_name.toLowerCase(),
        note,
        category: category || 'general',
        source_type: source_type || 'manual',
        source_id,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create player note:", error)
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, note: data })

  } catch (error) {
    console.error("Player note creation error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}

// GET /api/player-notes?player=name - Get notes for a player
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const playerName = searchParams.get("player")

    let query = supabase
      .from("player_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (playerName) {
      query = query.ilike("player_name", playerName.toLowerCase())
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error("Failed to fetch player notes:", error)
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ notes: data })

  } catch (error) {
    console.error("Player notes fetch error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}

// DELETE /api/player-notes?id=uuid - Delete a player note
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const noteId = searchParams.get("id")

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("player_notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Failed to delete player note:", error)
      return NextResponse.json(
        { error: "Failed to delete note" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Player note deletion error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
