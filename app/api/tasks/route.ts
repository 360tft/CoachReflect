import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

// GET /api/tasks - List tasks with optional status filter
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const limit = parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq("status", status)
    }
    if (source) {
      query = query.eq("source", source)
    }

    const { data: tasks, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks - Create a manual task
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(`tasks:post:${user.id}`, RATE_LIMITS.REFLECTIONS)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { title, description, priority, due_date } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (title.length > 500) {
      return NextResponse.json({ error: "Title too long" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: task, error } = await adminClient
      .from("tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "medium",
        due_date: due_date || null,
        source: "manual",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(task, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
