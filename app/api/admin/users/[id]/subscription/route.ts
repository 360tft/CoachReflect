import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"

// PATCH - Update user subscription tier
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params
    const { tier } = await request.json()

    if (!tier || !["free", "pro", "pro_plus"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Update user's subscription tier
    const { error } = await adminClient
      .from("profiles")
      .update({
        subscription_tier: tier,
        subscription_status: tier !== "free" ? "active" : "canceled",
      })
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true, tier })

  } catch {
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}
