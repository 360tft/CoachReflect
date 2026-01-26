import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"
import { MOOD_OPTIONS } from "@/app/types"

// GET - Fetch content for mining (themes, reflections, challenges)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "7")

    const adminClient = createAdminClient()

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get reflections from the period
    const { data: reflections } = await adminClient
      .from("reflections")
      .select(`
        id,
        date,
        what_worked,
        what_didnt_work,
        player_standouts,
        areas_to_improve,
        ai_summary,
        mood_rating,
        energy_rating,
        tags
      `)
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(50)

    // Get conversation count
    const { count: conversationCount } = await adminClient
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", cutoffDate.toISOString())

    // Get extracted insights (themes)
    const { data: insights } = await adminClient
      .from("extracted_insights")
      .select("insight_type, name, snippet")
      .gte("created_at", cutoffDate.toISOString())
      .eq("insight_type", "theme")

    // Aggregate themes
    const themeMap = new Map<string, { count: number; snippets: string[] }>()
    insights?.forEach(insight => {
      if (insight.name) {
        const existing = themeMap.get(insight.name) || { count: 0, snippets: [] }
        existing.count++
        if (insight.snippet && existing.snippets.length < 5) {
          existing.snippets.push(insight.snippet)
        }
        themeMap.set(insight.name, existing)
      }
    })

    const themes = Array.from(themeMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        recent_snippets: data.snippets,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Extract common challenges from "what_didnt_work" field
    const challenges: string[] = []
    reflections?.forEach(r => {
      if (r.what_didnt_work && r.what_didnt_work.length > 20 && r.what_didnt_work.length < 300) {
        challenges.push(r.what_didnt_work)
      }
    })

    // Get unique challenges (simple deduplication)
    const uniqueChallenges = [...new Set(challenges)].slice(0, 10)

    // Format top reflections (anonymized)
    const topReflections = (reflections || [])
      .filter(r => r.what_worked || r.what_didnt_work || r.ai_summary)
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        date: r.date,
        what_worked: r.what_worked,
        what_didnt_work: r.what_didnt_work,
        player_standouts: r.player_standouts,
        ai_summary: r.ai_summary,
        mood_label: MOOD_OPTIONS.find(m => m.value === r.mood_rating)?.label || "Neutral",
        energy_rating: r.energy_rating,
        tags: r.tags || [],
      }))

    return NextResponse.json({
      period: `${days} days`,
      total_reflections: reflections?.length || 0,
      total_conversations: conversationCount || 0,
      themes,
      common_challenges: uniqueChallenges,
      top_reflections: topReflections,
    })

  } catch {
    return NextResponse.json({ error: "Failed to fetch content data" }, { status: 500 })
  }
}
