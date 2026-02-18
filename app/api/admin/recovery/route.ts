import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"
import { Resend } from "resend"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CoachReflection <hello@send.coachreflection.com>"

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// GET - Fetch abandoned checkouts
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Look for users who have a stripe_customer_id but are still on free tier
    // These are users who started checkout but didn't complete
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, display_name, subscription_tier, stripe_customer_id, created_at")
      .not("stripe_customer_id", "is", null)
      .eq("subscription_tier", "free")
      .order("created_at", { ascending: false })
      .limit(50)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ checkouts: [] })
    }

    // Get user emails
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]))

    // Get recovery email logs
    const userIds = profiles.map(p => p.user_id)
    const { data: emailLogs } = await adminClient
      .from("email_logs")
      .select("user_id, sent_at")
      .in("user_id", userIds)
      .eq("email_type", "checkout_recovery")
      .order("sent_at", { ascending: false })

    const recoveryMap = new Map<string, string>()
    emailLogs?.forEach(e => {
      if (!recoveryMap.has(e.user_id)) {
        recoveryMap.set(e.user_id, e.sent_at)
      }
    })

    // Build response
    const checkouts = profiles.map(profile => {
      const createdAt = new Date(profile.created_at)
      const hoursAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60))

      return {
        id: profile.user_id,
        email: emailMap.get(profile.user_id) || "Unknown",
        display_name: profile.display_name,
        stripe_customer_id: profile.stripe_customer_id,
        created_at: profile.created_at,
        hours_ago: hoursAgo,
        recovery_sent_at: recoveryMap.get(profile.user_id) || null,
      }
    }).filter(c => c.email !== "Unknown")

    return NextResponse.json({ checkouts })

  } catch {
    return NextResponse.json({ error: "Failed to fetch recovery data" }, { status: 500 })
  }
}

// POST - Send recovery email
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, email, displayName } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const name = displayName || "Coach"

    // Send recovery email
    const { error: sendError } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: "admin@360tft.com",
      subject: "Complete your CoachReflection upgrade",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E5A11C;">Hi ${name},</h2>

          <p>I noticed you started upgrading to CoachReflection Pro but didn't finish.</p>

          <p>No worries - these things happen! Your cart is still waiting for you.</p>

          <p>As a reminder, <strong>Pro</strong> gives you:</p>
          <ul>
            <li>Unlimited reflections and conversations</li>
            <li>AI-powered theme extraction and insights</li>
            <li>Full analytics history (not just 4 weeks)</li>
            <li>CPD documentation export</li>
            <li>Voice note uploads</li>
            <li>Session plan image analysis</li>
          </ul>

          <p style="margin: 30px 0;">
            <a href="https://coachreflection.com/dashboard/settings" style="background-color: #E5A11C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Complete Your Upgrade
            </a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Questions? Just reply to this email - I read every one.<br/>
            Kevin @ CoachReflection
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
      email_type: "checkout_recovery",
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
