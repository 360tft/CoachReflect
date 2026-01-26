import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"
import { Resend } from "resend"
import { renderTemplate } from "@/lib/email-templates"

// Configure web-push
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@360tft.com"

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// GET /api/cron/send-reminders
// Run every hour to check for scheduled reminders
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check required config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 })
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "Missing VAPID config" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get current time in different timezones
  const now = new Date()
  const currentHour = now.getUTCHours()
  const currentMinute = now.getUTCMinutes()
  const currentDay = now.getUTCDay() // 0 = Sunday

  // Find schedules that should fire now
  // We're checking for daily reminders that match the current time
  const { data: schedules, error: scheduleError } = await supabase
    .from("reminder_schedules")
    .select("*")
    .eq("enabled", true)
    .eq("reminder_type", "daily")

  if (scheduleError) {
    console.error("[Send Reminders] Error fetching schedules:", scheduleError)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  let sent = 0
  let errors = 0
  const results: { user_id: string; status: string; error?: string; push?: boolean; email?: boolean }[] = []

  for (const schedule of schedules || []) {
    try {
      // Check if current day is in the schedule's days_of_week
      const daysOfWeek = schedule.days_of_week || [1, 2, 3, 4, 5]
      if (!daysOfWeek.includes(currentDay)) {
        continue
      }

      // Parse schedule time (format: HH:MM:SS)
      const [scheduleHour, scheduleMinute] = (schedule.time_of_day || "19:00:00")
        .split(":")
        .map(Number)

      // Convert schedule time to UTC based on timezone
      // For simplicity, we'll do a basic timezone offset calculation
      // In production, use a proper timezone library
      const timezoneOffset = getTimezoneOffset(schedule.timezone || "Europe/London")
      const scheduleUtcHour = (scheduleHour - timezoneOffset + 24) % 24

      // Check if we're within the notification window (same hour)
      if (currentHour !== scheduleUtcHour) {
        continue
      }

      // Check if we're within the first 15 minutes of the hour
      // This prevents sending multiple times if cron runs more than once per hour
      if (currentMinute > 15) {
        continue
      }

      // Check if we already sent today
      const today = now.toISOString().split('T')[0]
      const lastSentDate = schedule.last_sent_at
        ? new Date(schedule.last_sent_at).toISOString().split('T')[0]
        : null

      if (lastSentDate === today) {
        continue
      }

      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", schedule.user_id)
        .eq("is_active", true)

      if (!subscriptions || subscriptions.length === 0) {
        continue
      }

      // Send notification to all active subscriptions
      const payload = JSON.stringify({
        title: "Time to Reflect",
        body: "How did today's session go? Take 2 minutes to reflect.",
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        data: {
          url: "/dashboard/chat",
          type: "reminder",
        },
      })

      let sentToUser = false
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          sentToUser = true
        } catch (pushError) {
          // If subscription is invalid, mark it inactive
          if ((pushError as { statusCode?: number })?.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .update({ is_active: false })
              .eq("id", sub.id)
          }
          console.error(`[Send Reminders] Push failed for sub ${sub.id}:`, pushError)
        }
      }

      // Also send email reminder
      let emailSent = false
      try {
        // Get user email and profile
        const { data: userData } = await supabase.auth.admin.getUserById(schedule.user_id)
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, email_notifications_enabled")
          .eq("user_id", schedule.user_id)
          .single()

        if (userData?.user?.email && profile?.email_notifications_enabled !== false) {
          const emailHtml = renderTemplate("daily-reminder", {
            name: profile?.display_name || "Coach",
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?user=${schedule.user_id}`,
          })

          if (emailHtml) {
            await getResend().emails.send({
              from: "Coach Reflection <reminders@coachreflection.com>",
              to: userData.user.email,
              subject: "Time to Reflect on Today's Session",
              html: emailHtml,
            })
            emailSent = true
          }
        }
      } catch (emailError) {
        console.error(`[Send Reminders] Email failed for user ${schedule.user_id}:`, emailError)
      }

      if (sentToUser || emailSent) {
        // Update last_sent_at
        await supabase
          .from("reminder_schedules")
          .update({ last_sent_at: now.toISOString() })
          .eq("id", schedule.id)

        sent++
        results.push({
          user_id: schedule.user_id,
          status: "sent",
          push: sentToUser,
          email: emailSent,
        })
      }

    } catch (error) {
      console.error(`[Send Reminders] Error processing schedule ${schedule.id}:`, error)
      errors++
      results.push({ user_id: schedule.user_id, status: "error", error: String(error) })
    }
  }

  console.log(`[Send Reminders] Sent: ${sent}, Errors: ${errors}`)

  return NextResponse.json({
    processed: schedules?.length || 0,
    sent,
    errors,
    results,
  })
}

// Simple timezone offset lookup (hours from UTC)
// In production, use a proper timezone library like date-fns-tz
function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    "Europe/London": 0, // GMT/BST (simplified)
    "Europe/Paris": 1,
    "Europe/Berlin": 1,
    "America/New_York": -5,
    "America/Chicago": -6,
    "America/Denver": -7,
    "America/Los_Angeles": -8,
    "Australia/Sydney": 10,
    "Asia/Tokyo": 9,
    "Asia/Singapore": 8,
  }
  return offsets[timezone] ?? 0
}
