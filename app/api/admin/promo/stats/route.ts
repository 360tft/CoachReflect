import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"

// GET - Promo email conversion stats
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Count how many promo emails were sent
    const { count: emailsSent } = await adminClient
      .from("email_log")
      .select("*", { count: "exact", head: true })
      .eq("email_type", "promo-annual-50")

    // Get user_ids who received the promo email
    const { data: promoRecipients } = await adminClient
      .from("email_log")
      .select("user_id")
      .eq("email_type", "promo-annual-50")

    const recipientIds = promoRecipients?.map(r => r.user_id) || []

    // Count how many of those users are now on a paid tier
    let converted = 0
    if (recipientIds.length > 0) {
      const { count } = await adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("user_id", recipientIds)
        .neq("subscription_tier", "free")

      converted = count || 0
    }

    const total = emailsSent || 0
    const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0"

    return NextResponse.json({
      emails_sent: total,
      converted,
      conversion_rate: rate,
    })

  } catch {
    return NextResponse.json({ error: "Failed to fetch promo stats" }, { status: 500 })
  }
}
