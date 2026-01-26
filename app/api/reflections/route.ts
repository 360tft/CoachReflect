import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

// Admin client for calling database functions
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`reflections:get:${user.id}`, RATE_LIMITS.REFLECTIONS)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    const { data: reflections, error } = await supabase
      .from("reflections")
      .select("*, sessions(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(reflections)
  } catch (error) {
    console.error("Error fetching reflections:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`reflections:post:${user.id}`, RATE_LIMITS.REFLECTIONS)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      session_id,
      date,
      what_worked,
      what_didnt_work,
      player_standouts,
      areas_to_improve,
      next_focus,
      mood_rating,
      energy_rating,
      tags,
      is_private = true,
    } = body

    // Create the reflection
    const { data: reflection, error } = await supabase
      .from("reflections")
      .insert({
        user_id: user.id,
        session_id,
        date: date || new Date().toISOString().split("T")[0],
        what_worked,
        what_didnt_work,
        player_standouts,
        areas_to_improve,
        next_focus,
        mood_rating,
        energy_rating,
        tags: tags || [],
        is_private,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update streak and check for badges (using admin client for full access)
    const adminClient = getAdminClient()

    // Call the streak update function
    const { data: streakResult } = await adminClient.rpc("update_user_streak", {
      p_user_id: user.id,
    })

    // Check for reflection count badges
    const { data: badgesResult } = await adminClient.rpc("check_reflection_badges", {
      p_user_id: user.id,
    })

    // Update last active timestamp
    await adminClient
      .from("profiles")
      .update({
        last_active_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    // Combine earned badges
    const earnedBadges: string[] = [
      ...(streakResult?.[0]?.badges_earned || []),
      ...(badgesResult || []),
    ]

    return NextResponse.json({
      ...reflection,
      streak: streakResult?.[0],
      earnedBadges,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating reflection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
