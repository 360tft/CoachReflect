import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/reminders - Create or update a reminder schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reminder_type, enabled, days_of_week, time_of_day, timezone, delivery_method } = body

    const validTypes = ['after_session', 'daily', 'custom']
    if (!validTypes.includes(reminder_type)) {
      return NextResponse.json(
        { error: "Invalid reminder_type" },
        { status: 400 }
      )
    }

    const validDeliveryMethods = ['email', 'push', 'both']
    const safeDeliveryMethod = validDeliveryMethods.includes(delivery_method)
      ? delivery_method
      : 'email'

    // Upsert the reminder schedule
    const { data, error } = await supabase
      .from("reminder_schedules")
      .upsert({
        user_id: user.id,
        reminder_type,
        enabled: enabled ?? true,
        days_of_week: days_of_week ?? [1, 2, 3, 4, 5], // Mon-Fri default
        time_of_day: time_of_day ?? '19:00:00',
        timezone: timezone ?? 'Europe/London',
        delivery_method: safeDeliveryMethod,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,reminder_type',
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to save reminder:", error)
      return NextResponse.json(
        { error: "Failed to save reminder" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reminder: data })

  } catch (error) {
    console.error("Reminder save error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}

// GET /api/reminders - Get user's reminder schedules
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("reminder_schedules")
      .select("*")
      .eq("user_id", user.id)

    if (error) {
      console.error("Failed to fetch reminders:", error)
      return NextResponse.json(
        { error: "Failed to fetch reminders" },
        { status: 500 }
      )
    }

    return NextResponse.json({ reminders: data || [] })

  } catch (error) {
    console.error("Reminder fetch error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}

// DELETE /api/reminders?type=daily - Delete a reminder schedule
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reminderType = searchParams.get("type")

    if (!reminderType) {
      return NextResponse.json(
        { error: "Reminder type required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("reminder_schedules")
      .delete()
      .eq("user_id", user.id)
      .eq("reminder_type", reminderType)

    if (error) {
      console.error("Failed to delete reminder:", error)
      return NextResponse.json(
        { error: "Failed to delete reminder" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Reminder delete error:", error)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
