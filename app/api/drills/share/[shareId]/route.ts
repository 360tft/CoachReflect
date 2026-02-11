import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET - Public drill view by share_id (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('saved_drills')
      .select('id, share_id, name, description, category, age_group, type, set_piece_type, drill_data, view_count, created_at')
      .eq('share_id', shareId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 })
    }

    // Increment view count (fire and forget)
    adminClient
      .from('saved_drills')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => {})

    return NextResponse.json({ drill: data })
  } catch (error) {
    console.error('Shared drill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
