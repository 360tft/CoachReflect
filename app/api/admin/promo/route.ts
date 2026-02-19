import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { createElement } from "react"
import { PromoAnnualEmail } from "@/emails/templates/promo-annual"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CoachReflection <hello@send.coachreflection.com>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://coachreflection.com"

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// GET - Preview: list free users who would receive the promo email
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get all free-tier users
    const { data: freeProfiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("user_id, display_name, subscription_tier")
      .eq("subscription_tier", "free")

    if (profilesError) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    // Get emails from auth
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]))

    // Check who already received this promo
    const userIds = freeProfiles?.map(p => p.user_id) || []
    const { data: alreadySent } = await adminClient
      .from("email_log")
      .select("user_id")
      .in("user_id", userIds)
      .eq("email_type", "promo-annual-50")

    const alreadySentSet = new Set(alreadySent?.map(e => e.user_id) || [])

    const recipients = (freeProfiles || [])
      .map(p => ({
        user_id: p.user_id,
        email: emailMap.get(p.user_id) || null,
        display_name: p.display_name,
        already_sent: alreadySentSet.has(p.user_id),
      }))
      .filter(r => r.email && !r.already_sent)

    const alreadyReceived = (freeProfiles || []).filter(p => alreadySentSet.has(p.user_id)).length

    return NextResponse.json({
      total_free_users: freeProfiles?.length || 0,
      already_received: alreadyReceived,
      will_receive: recipients.length,
      recipients: recipients.map(r => ({ email: r.email, name: r.display_name })),
    })

  } catch {
    return NextResponse.json({ error: "Failed to fetch promo data" }, { status: 500 })
  }
}

// POST - Send the promo email to all free users
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const resend = getResendClient()

    // Get all free-tier users
    const { data: freeProfiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("user_id, display_name, subscription_tier")
      .eq("subscription_tier", "free")

    if (profilesError) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    // Get emails from auth
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]))

    // Check who already received this promo (prevent double-send)
    const userIds = freeProfiles?.map(p => p.user_id) || []
    const { data: alreadySent } = await adminClient
      .from("email_log")
      .select("user_id")
      .in("user_id", userIds)
      .eq("email_type", "promo-annual-50")

    const alreadySentSet = new Set(alreadySent?.map(e => e.user_id) || [])

    const recipients = (freeProfiles || [])
      .map(p => ({
        user_id: p.user_id,
        email: emailMap.get(p.user_id) || null,
        display_name: p.display_name,
      }))
      .filter(r => r.email && !alreadySentSet.has(r.user_id))

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const recipient of recipients) {
      try {
        const name = recipient.display_name || recipient.email!.split("@")[0] || "Coach"
        const unsubscribeUrl = `${APP_URL}/unsubscribe?userId=${recipient.user_id}`

        const element = createElement(PromoAnnualEmail, { name, unsubscribeUrl })
        const html = await render(element)

        await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient.email!,
          replyTo: "admin@360tft.com",
          subject: "Half price Pro for your first year",
          html,
        })

        // Log to prevent double-send
        await adminClient.from("email_log").insert({
          user_id: recipient.user_id,
          email_type: "promo-annual-50",
          subject: "Half price Pro for your first year",
          sent_at: new Date().toISOString(),
        })

        sent++

        // Rate limit: Resend free tier is 2/sec, paid is 80/sec
        // Small delay to be safe
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        failed++
        errors.push(`${recipient.email}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({
      sent,
      failed,
      skipped: alreadySentSet.size,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch {
    return NextResponse.json({ error: "Failed to send promo emails" }, { status: 500 })
  }
}
