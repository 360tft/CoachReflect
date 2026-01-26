import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"
import { Resend } from "resend"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Coach Reflection <hello@coachreflection.com>"

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// GET - Fetch inactive users
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "7")
    const tier = searchParams.get("tier") || "all"

    const adminClient = createAdminClient()

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Query for inactive users
    let query = adminClient
      .from("profiles")
      .select(`
        user_id,
        display_name,
        subscription_tier,
        created_at,
        last_active_at
      `)
      .or(`last_active_at.is.null,last_active_at.lt.${cutoffDate.toISOString()}`)
      .order("last_active_at", { ascending: true, nullsFirst: true })
      .limit(100)

    if (tier !== "all") {
      query = query.eq("subscription_tier", tier)
    }

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Get user emails from auth (need admin client for this)
    const userIds = profiles?.map(p => p.user_id) || []

    // Get message counts
    const { data: messageCounts } = await adminClient
      .from("messages")
      .select("user_id")
      .in("user_id", userIds)
      .eq("role", "user")

    // Get reflection counts
    const { data: reflectionCounts } = await adminClient
      .from("reflections")
      .select("user_id")
      .in("user_id", userIds)

    // Get last email sent dates
    const { data: emailLogs } = await adminClient
      .from("email_logs")
      .select("user_id, sent_at")
      .in("user_id", userIds)
      .eq("email_type", "reengagement")
      .order("sent_at", { ascending: false })

    // Get user emails from auth.users
    const { data: authUsers } = await adminClient.auth.admin.listUsers()

    // Build user map
    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]))
    const messageCountMap = new Map<string, number>()
    const reflectionCountMap = new Map<string, number>()
    const lastEmailMap = new Map<string, string>()

    messageCounts?.forEach(m => {
      messageCountMap.set(m.user_id, (messageCountMap.get(m.user_id) || 0) + 1)
    })

    reflectionCounts?.forEach(r => {
      reflectionCountMap.set(r.user_id, (reflectionCountMap.get(r.user_id) || 0) + 1)
    })

    emailLogs?.forEach(e => {
      if (!lastEmailMap.has(e.user_id)) {
        lastEmailMap.set(e.user_id, e.sent_at)
      }
    })

    // Build response
    const users = profiles?.map(profile => {
      const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : new Date(profile.created_at)
      const daysInactive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: profile.user_id,
        email: emailMap.get(profile.user_id) || "Unknown",
        display_name: profile.display_name,
        subscription_tier: profile.subscription_tier,
        created_at: profile.created_at,
        last_active_at: profile.last_active_at,
        days_inactive: daysInactive,
        total_messages: messageCountMap.get(profile.user_id) || 0,
        total_reflections: reflectionCountMap.get(profile.user_id) || 0,
        last_email_sent: lastEmailMap.get(profile.user_id) || null,
      }
    }).filter(u => u.email !== "Unknown") || []

    return NextResponse.json({ users })

  } catch {
    return NextResponse.json({ error: "Failed to fetch engagement data" }, { status: 500 })
  }
}

// POST - Send re-engagement email
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, email, displayName, daysInactive } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const name = displayName || "Coach"

    // Send re-engagement email
    const { error: sendError } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: "admin@360tft.com",
      subject: "We miss you at Coach Reflection",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E5A11C;">Hi ${name},</h2>

          <p>It's been ${daysInactive || "a while"} days since you last reflected on your coaching sessions.</p>

          <p>Taking just 2 minutes after each session to reflect can transform how you grow as a coach. Your insights build up over time, revealing patterns you'd never notice otherwise.</p>

          <p>Here's what coaches are discovering with Coach Reflection:</p>
          <ul>
            <li>Which players need extra attention</li>
            <li>Patterns in their coaching mood and energy</li>
            <li>What's actually working in their sessions</li>
          </ul>

          <p style="margin: 30px 0;">
            <a href="https://coachreflection.com/dashboard/chat" style="background-color: #E5A11C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Start Reflecting
            </a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Questions? Just reply to this email.<br/>
            Kevin @ Coach Reflection
          </p>
        </div>
      `,
    })

    if (sendError) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    // Log the email
    const adminClient = createAdminClient()
    await adminClient.from("email_logs").insert({
      user_id: userId,
      email_type: "reengagement",
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
