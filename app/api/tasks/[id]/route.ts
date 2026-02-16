import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateTaskMilestones } from "@/lib/gamification"

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, priority, due_date, title, description } = body

    // Validate status
    if (status && !["pending", "completed", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate priority
    if (priority && !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
    }

    // Verify task belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Build update object
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (priority) update.priority = priority
    if (due_date !== undefined) update.due_date = due_date
    if (title !== undefined) update.title = title.trim()
    if (description !== undefined) update.description = description?.trim() || null

    // Set completed_at when completing
    if (status === "completed" && existing.status !== "completed") {
      update.completed_at = new Date().toISOString()
    } else if (status === "pending") {
      update.completed_at = null
    }

    const adminClient = createAdminClient()
    const { data: task, error } = await adminClient
      .from("tasks")
      .update(update)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger gamification on completion
    let newBadges: string[] = []
    if (status === "completed" && existing.status !== "completed") {
      try {
        newBadges = await updateTaskMilestones(user.id)
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ ...task, newBadges })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
