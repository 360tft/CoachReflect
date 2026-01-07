import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SUBSCRIPTION_LIMITS } from "@/app/types"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Check subscription limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, reflections_this_month")
      .eq("user_id", user.id)
      .single()

    const subscriptionTier = profile?.subscription_tier || "free"
    const limits = SUBSCRIPTION_LIMITS[subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS]
    const reflectionsThisMonth = profile?.reflections_this_month || 0

    if (subscriptionTier === "free" && reflectionsThisMonth >= limits.reflections_per_month) {
      return NextResponse.json(
        { error: "Monthly reflection limit reached. Upgrade to Pro for unlimited reflections." },
        { status: 403 }
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

    return NextResponse.json(reflection, { status: 201 })
  } catch (error) {
    console.error("Error creating reflection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
