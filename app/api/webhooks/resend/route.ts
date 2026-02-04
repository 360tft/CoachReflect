import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id?: string
    from?: string
    to?: string[]
    subject?: string
    created_at?: string
    [key: string]: unknown
  }
}

// Map subject lines to email types
function inferEmailType(subject: string | undefined): string {
  if (!subject) return "unknown"

  const subjectLower = subject.toLowerCase()

  if (subjectLower.includes("welcome")) return "welcome"
  if (subjectLower.includes("first reflection")) return "first-reflection"
  if (subjectLower.includes("3 questions")) return "reflection-tips"
  if (subjectLower.includes("how are your reflections")) return "check-in"
  if (subjectLower.includes("ai-powered insights")) return "upgrade-pitch"
  if (subjectLower.includes("streak")) return "streak-milestone"
  if (subjectLower.includes("miss your reflections")) return "winback"
  if (subjectLower.includes("chat with your coaching")) return "winback-feature"
  if (subjectLower.includes("quick reminder about")) return "winback-final"
  if (subjectLower.includes("complete your") && subjectLower.includes("upgrade")) return "checkout-recovery"
  if (subjectLower.includes("pro subscription")) return "admin-notification"
  if (subjectLower.includes("canceled")) return "admin-notification"
  if (subjectLower.includes("new coach reflection signup")) return "admin-notification"
  if (subjectLower.includes("weekly") || subjectLower.includes("your week")) return "weekly-summary"
  if (subjectLower.includes("social proof") || subjectLower.includes("coaches are reflecting")) return "social-proof"
  if (subjectLower.includes("voice") || subjectLower.includes("feature highlight")) return "feature-highlight"
  if (subjectLower.includes("thank you from")) return "last-chance"
  if (subjectLower.includes("don't lose your")) return "streak-at-risk"

  return "other"
}

function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// GET handler for Resend verification ping
export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const body = await request.text()

  // Verify signature if secret is configured
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = request.headers.get("resend-signature")
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      // Always return 200 to prevent retries
      return NextResponse.json({ error: "Invalid signature" })
    }
  }

  let payload: ResendWebhookPayload

  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" })
  }

  // Map Resend event types
  const eventType = payload.type?.replace("email.", "") || "unknown"
  const validEvents = ["sent", "delivered", "opened", "clicked", "bounced", "complained", "delivery_delayed"]

  if (!validEvents.includes(eventType)) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    const supabase = createAdminClient()

    // Try to find user by recipient email
    const recipientEmail = payload.data?.to?.[0]
    let userId: string | null = null

    if (recipientEmail) {
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === recipientEmail)
      if (user) {
        userId = user.id
      }
    }

    const emailType = inferEmailType(payload.data?.subject)

    await supabase.from("email_events").insert({
      user_id: userId,
      email_id: payload.data?.email_id || null,
      email_type: emailType,
      event_type: eventType,
      event_data: {
        from: payload.data?.from,
        to: payload.data?.to,
        subject: payload.data?.subject,
        created_at: payload.data?.created_at,
      },
    })
  } catch (error) {
    // Log but always return 200 to prevent retries
    console.error("[Resend Webhook] Error processing event:", error)
  }

  return NextResponse.json({ received: true })
}
