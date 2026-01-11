import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/gamification - Fetch user's streak and badges
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch streak
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Fetch user badges with badge details
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select(`
        id,
        earned_at,
        notified,
        badge:badges (
          id,
          name,
          description,
          emoji,
          category,
          rarity
        )
      `)
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })

    // Fetch all available badges for progress display
    const { data: allBadges } = await supabase
      .from("badges")
      .select("*")
      .order("requirement_value", { ascending: true })

    // Mark any unnotified badges as notified
    const unnotifiedBadges = userBadges?.filter(ub => !ub.notified) || []
    if (unnotifiedBadges.length > 0) {
      await supabase
        .from("user_badges")
        .update({ notified: true })
        .in("id", unnotifiedBadges.map(ub => ub.id))
    }

    return NextResponse.json({
      streak: streak || {
        current_streak: 0,
        longest_streak: 0,
        total_active_days: 0,
      },
      userBadges: userBadges || [],
      allBadges: allBadges || [],
      newBadges: unnotifiedBadges.map(ub => ub.badge),
    })

  } catch (error) {
    console.error("Gamification API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch gamification data" },
      { status: 500 }
    )
  }
}
