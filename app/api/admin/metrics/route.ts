import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { isAdminUser } from "@/lib/admin"

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin access
    if (!isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use admin client for full access
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get date ranges
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - 7)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Fetch metrics in parallel
    const [
      totalUsersResult,
      proUsersResult,
      todayUsersResult,
      weekUsersResult,
      totalReflectionsResult,
      todayReflectionsResult,
      weekReflectionsResult,
      totalConversationsResult,
      recentFeedbackResult,
      emailsSentResult,
      recentSignupsResult,
    ] = await Promise.all([
      // Total users
      adminClient.from("profiles").select("*", { count: "exact", head: true }),
      // Pro users
      adminClient.from("profiles").select("*", { count: "exact", head: true }).neq("subscription_tier", "free"),
      // Users today
      adminClient.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
      // Users this week
      adminClient.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
      // Total reflections
      adminClient.from("reflections").select("*", { count: "exact", head: true }),
      // Reflections today
      adminClient.from("reflections").select("*", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
      // Reflections this week
      adminClient.from("reflections").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
      // Total conversations
      adminClient.from("conversations").select("*", { count: "exact", head: true }),
      // Recent feedback
      adminClient.from("feedback").select("rating").order("created_at", { ascending: false }).limit(100),
      // Emails sent this month
      adminClient.from("email_log").select("*", { count: "exact", head: true }).gte("sent_at", startOfMonth.toISOString()).is("error", null),
      // Recent signups
      adminClient.from("profiles").select("id, display_name, subscription_tier, created_at").order("created_at", { ascending: false }).limit(10),
    ])

    // Calculate feedback stats
    const feedbackData = recentFeedbackResult.data || []
    const positiveCount = feedbackData.filter((f: { rating: string }) => f.rating === "positive").length
    const feedbackTotal = feedbackData.length
    const satisfactionRate = feedbackTotal > 0 ? Math.round((positiveCount / feedbackTotal) * 100) : null

    return NextResponse.json({
      users: {
        total: totalUsersResult.count || 0,
        pro: proUsersResult.count || 0,
        today: todayUsersResult.count || 0,
        week: weekUsersResult.count || 0,
      },
      reflections: {
        total: totalReflectionsResult.count || 0,
        today: todayReflectionsResult.count || 0,
        week: weekReflectionsResult.count || 0,
      },
      conversations: {
        total: totalConversationsResult.count || 0,
      },
      feedback: {
        satisfactionRate,
        total: feedbackTotal,
      },
      emails: {
        sentThisMonth: emailsSentResult.count || 0,
      },
      recentSignups: recentSignupsResult.data || [],
    })

  } catch (error) {
    console.error("Admin metrics error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
