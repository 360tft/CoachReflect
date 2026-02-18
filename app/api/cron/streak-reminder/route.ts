import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://coachreflection.com"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CoachReflection <hello@send.coachreflection.com>"

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY

  if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const resend = new Resend(resendApiKey)

  // Find users with active streaks (>=3 days) who haven't been active today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]

  const { data: atRiskStreaks, error: streakError } = await supabase
    .from("streaks")
    .select("user_id, current_streak, last_activity_date")
    .gte("current_streak", 3)
    .lt("last_activity_date", todayStr)
    .limit(100)

  if (streakError) {
    console.error("[Streak Reminder] Error fetching streaks:", streakError)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const streak of atRiskStreaks || []) {
    // Check profile email preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notifications_enabled, email_unsubscribed")
      .eq("user_id", streak.user_id)
      .single()

    if (!profile || profile.email_unsubscribed || profile.email_notifications_enabled === false) {
      skipped++
      continue
    }

    // Check if we already sent a streak reminder today
    const { data: alreadySent } = await supabase
      .from("email_log")
      .select("id")
      .eq("user_id", streak.user_id)
      .eq("email_type", "streak-at-risk")
      .gte("sent_at", today.toISOString())
      .limit(1)

    if (alreadySent && alreadySent.length > 0) {
      skipped++
      continue
    }

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(streak.user_id)
    if (!userData?.user?.email) {
      skipped++
      continue
    }

    const userName = userData.user.user_metadata?.display_name || userData.user.email.split("@")[0] || "Coach"
    const streakDays = streak.current_streak

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: userData.user.email,
        subject: `Don't lose your ${streakDays} day streak!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; color: #92400e; margin: 10px 0;">CoachReflection</h1>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hey ${userName},</p>

            <div style="text-align: center; margin: 24px 0;">
              <span style="font-size: 48px; font-weight: bold; color: #E5A11C;">${streakDays}</span>
              <p style="font-size: 16px; color: #92400e; margin: 4px 0;">day streak at risk</p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              You've been reflecting for ${streakDays} days straight. Don't let that slip away.
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              A quick 2-minute reflection is all it takes to keep it going.
            </p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard/chat" style="background: #E5A11C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">Reflect Now</a>
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Keep it going!</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <div style="text-align: center; color: #6b7280; font-size: 12px;">
              <p>Part of the 360TFT family of coaching tools</p>
              <p><a href="${APP_URL}/unsubscribe?userId=${streak.user_id}" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </div>
        `,
      })

      await supabase.from("email_log").insert({
        user_id: streak.user_id,
        email_type: "streak-at-risk",
        subject: `Don't lose your ${streakDays} day streak!`,
        sent_at: new Date().toISOString(),
      })

      sent++
      await delay(100)
    } catch (error) {
      console.error(`[Streak Reminder] Failed to send to ${userData.user.email}:`, error)
    }
  }

  return NextResponse.json({
    checked: atRiskStreaks?.length || 0,
    sent,
    skipped,
  })
}
