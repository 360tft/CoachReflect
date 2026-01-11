import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Admin client for updating user preferences
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, email, action } = body

    if (!user_id && !email) {
      return NextResponse.json(
        { error: "User ID or email required" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Find user by ID or email
    let userId = user_id
    if (!userId && email) {
      const { data: users } = await supabase.auth.admin.listUsers()
      const foundUser = users?.users.find(u => u.email === email)
      if (foundUser) {
        userId = foundUser.id
      } else {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
    }

    // Update preferences based on action
    if (action === "unsubscribe_all") {
      await supabase
        .from("profiles")
        .update({
          email_notifications_enabled: false,
          email_unsubscribed: true,
        })
        .eq("user_id", userId)

      // Pause any active email sequences
      await supabase
        .from("email_sequences")
        .update({ paused: true })
        .eq("user_id", userId)
        .eq("completed", false)

    } else if (action === "resubscribe") {
      await supabase
        .from("profiles")
        .update({
          email_notifications_enabled: true,
          email_unsubscribed: false,
        })
        .eq("user_id", userId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}
