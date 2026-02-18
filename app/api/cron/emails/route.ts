import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { getSequence, type SequenceName } from "@/lib/email-sequences"
import { renderTemplate } from "@/lib/email-templates"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CoachReflection <hello@send.coachreflection.com>'
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || 'admin@360tft.com'

// Helper to add delay between sends
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check required config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 })
  }

  if (!resendApiKey) {
    return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const resend = new Resend(resendApiKey)

  // Fetch sequences due to send
  const { data: sequences, error: fetchError } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("completed", false)
    .eq("paused", false)
    .lte("next_send_at", new Date().toISOString())
    .limit(100)

  if (fetchError) {
    console.error("[Cron Emails] Error fetching sequences:", fetchError)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  let sent = 0
  let errors = 0
  let skipped = 0
  const results: { email: string; status: string; error?: string }[] = []

  // Process each sequence
  for (const seq of sequences || []) {
    // Get user details
    const { data: userData } = await supabase.auth.admin.getUserById(seq.user_id)
    const user = userData?.user

    if (!user?.email) {
      console.error(`[Cron Emails] No email for user ${seq.user_id}`)
      continue
    }

    // Check email opt-in status
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notifications_enabled, email_unsubscribed, subscription_tier")
      .eq("user_id", seq.user_id)
      .single()

    if (profile?.email_unsubscribed || profile?.email_notifications_enabled === false) {
      // User opted out, pause the sequence
      await supabase
        .from("email_sequences")
        .update({ paused: true })
        .eq("id", seq.id)

      results.push({ email: user.email, status: "skipped - user opted out" })
      skipped++
      continue
    }

    // For onboarding: skip if user already upgraded to Pro
    if (seq.sequence_name === "onboarding" && profile?.subscription_tier !== "free") {
      await supabase
        .from("email_sequences")
        .update({ completed: true, paused: true })
        .eq("id", seq.id)

      results.push({ email: user.email, status: "skipped - user upgraded" })
      skipped++
      continue
    }

    // For trial: skip if user already converted (active) or cancelled (free)
    if (seq.sequence_name === "trial") {
      const { data: trialProfile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_tier")
        .eq("user_id", seq.user_id)
        .single()

      if (trialProfile?.subscription_status === "active" || trialProfile?.subscription_tier === "free") {
        await supabase
          .from("email_sequences")
          .update({ completed: true, paused: true })
          .eq("id", seq.id)

        results.push({ email: user.email, status: "skipped - trial resolved" })
        skipped++
        continue
      }
    }

    // Get sequence config and current step
    const sequence = getSequence(seq.sequence_name as SequenceName)
    const step = sequence[seq.current_step]

    if (!step) {
      // Sequence complete
      await supabase
        .from("email_sequences")
        .update({ completed: true })
        .eq("id", seq.id)

      results.push({ email: user.email, status: "sequence completed" })
      continue
    }

    // Render template
    const userName = user.user_metadata?.display_name || user.email.split("@")[0] || "Coach"
    const html = renderTemplate(step.template, {
      name: userName,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?user=${seq.user_id}`,
    })

    if (!html) {
      console.error(`[Cron Emails] Unknown template: ${step.template}`)
      results.push({ email: user.email, status: "error", error: `Unknown template: ${step.template}` })
      errors++
      continue
    }

    // Send email via Resend
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL,
        to: user.email,
        subject: step.subject,
        html,
      })

      // Calculate next send time
      const nextStep = sequence[seq.current_step + 1]
      let nextSendAt: string | null = null

      if (nextStep) {
        const startedAt = new Date(seq.started_at)
        const nextSendDate = new Date(startedAt)
        nextSendDate.setDate(nextSendDate.getDate() + nextStep.day)
        nextSendAt = nextSendDate.toISOString()
      }

      // Update sequence progress
      await supabase
        .from("email_sequences")
        .update({
          current_step: seq.current_step + 1,
          next_send_at: nextSendAt,
          completed: !nextStep,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seq.id)

      // Log the sent email
      await supabase.from("email_log").insert({
        user_id: seq.user_id,
        email_type: `${seq.sequence_name}:${step.template}`,
        subject: step.subject,
      })

      sent++
      results.push({ email: user.email, status: "sent" })

      // Rate limit: 100ms between sends
      await delay(100)

    } catch (error) {
      console.error(`[Cron Emails] Failed to send to ${user.email}:`, error)

      // Log the error
      await supabase.from("email_log").insert({
        user_id: seq.user_id,
        email_type: `${seq.sequence_name}:${step.template}`,
        subject: step.subject,
        error: String(error),
      })

      errors++
      results.push({ email: user.email, status: "error", error: String(error) })
    }
  }

  // Auto-start winback sequences for inactive users
  let winbackStarted = 0
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: inactiveProfiles } = await supabase
    .from("profiles")
    .select("user_id, last_active_at")
    .lt("last_active_at", sevenDaysAgo.toISOString())
    .eq("email_notifications_enabled", true)
    .eq("email_unsubscribed", false)
    .limit(50)

  if (inactiveProfiles) {
    for (const profile of inactiveProfiles) {
      // Check if already in active sequence
      const { data: existingSeq } = await supabase
        .from("email_sequences")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("completed", false)
        .single()

      if (existingSeq) continue

      // Check if received winback recently (30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentWinback } = await supabase
        .from("email_sequences")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("sequence_name", "winback")
        .gte("started_at", thirtyDaysAgo.toISOString())
        .single()

      if (recentWinback) continue

      // Start winback sequence
      const now = new Date()
      await supabase.from("email_sequences").insert({
        user_id: profile.user_id,
        sequence_name: "winback",
        current_step: 0,
        started_at: now.toISOString(),
        next_send_at: now.toISOString(),
        completed: false,
        paused: false,
      })

      winbackStarted++
    }
  }

  return NextResponse.json({
    processed: sequences?.length || 0,
    sent,
    errors,
    skipped,
    winbackStarted,
    results,
  })
}
