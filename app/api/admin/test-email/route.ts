import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/admin"
import { Resend } from "resend"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CoachReflection <hello@send.coachreflection.com>"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { to, subject, message } = await request.json()

    const targetEmail = to || "admin@360tft.com"
    const emailSubject = subject || "Test Email from CoachReflection"
    const emailMessage = message || "This is a test email to verify email sending is working."

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: "RESEND_API_KEY not configured",
        configured: false
      }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: targetEmail,
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E5A11C;">Test Email</h2>
          <p>${emailMessage}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toISOString()}<br/>
            From: CoachReflection Admin
          </p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({
        error: "Failed to send email",
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      sentTo: targetEmail
    })

  } catch (error) {
    return NextResponse.json({
      error: "Failed to send test email",
      details: String(error)
    }, { status: 500 })
  }
}
