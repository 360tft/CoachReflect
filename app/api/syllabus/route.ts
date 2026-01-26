import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasSyllabusFeature } from "@/lib/subscription"

/**
 * GET /api/syllabus - Get current user's syllabus (or club syllabus)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check for personal syllabus first
    const { data: personalSyllabus } = await adminClient
      .from('syllabi')
      .select('*')
      .eq('user_id', user.id)
      .is('club_id', null)
      .single()

    if (personalSyllabus) {
      return NextResponse.json({
        syllabus: personalSyllabus,
        type: 'personal',
      })
    }

    // Check for club syllabus
    const { data: membership } = await adminClient
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membership?.club_id) {
      const { data: clubSyllabus } = await adminClient
        .from('syllabi')
        .select('*')
        .eq('club_id', membership.club_id)
        .single()

      if (clubSyllabus) {
        return NextResponse.json({
          syllabus: clubSyllabus,
          type: 'club',
        })
      }
    }

    return NextResponse.json({ syllabus: null, type: null })

  } catch (error) {
    console.error("Syllabus GET error:", error)
    return NextResponse.json({ error: "Failed to fetch syllabus" }, { status: 500 })
  }
}

/**
 * DELETE /api/syllabus - Delete user's personal syllabus
 */
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get syllabus to delete the file
    const { data: syllabus } = await adminClient
      .from('syllabi')
      .select('id, file_url')
      .eq('user_id', user.id)
      .is('club_id', null)
      .single()

    if (!syllabus) {
      return NextResponse.json({ error: "No syllabus found" }, { status: 404 })
    }

    // Delete from storage
    if (syllabus.file_url) {
      const storagePath = syllabus.file_url.split('/').pop()
      if (storagePath) {
        await adminClient.storage.from('syllabi').remove([`${user.id}/${storagePath}`])
      }
    }

    // Delete record
    const { error } = await adminClient
      .from('syllabi')
      .delete()
      .eq('id', syllabus.id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete syllabus" }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Syllabus DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete syllabus" }, { status: 500 })
  }
}
