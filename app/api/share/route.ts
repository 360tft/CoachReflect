import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// POST /api/share - Create a share link for a reflection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reflection_id, share_excerpt } = await request.json()

    if (!reflection_id) {
      return NextResponse.json({ error: 'Reflection ID is required' }, { status: 400 })
    }

    // Verify user owns this reflection
    const { data: reflection, error: reflectionError } = await supabase
      .from('reflections')
      .select('id, user_id')
      .eq('id', reflection_id)
      .eq('user_id', user.id)
      .single()

    if (reflectionError || !reflection) {
      return NextResponse.json({ error: 'Reflection not found' }, { status: 404 })
    }

    // Check if share already exists
    const { data: existingShare } = await supabase
      .from('shared_reflections')
      .select('share_id')
      .eq('reflection_id', reflection_id)
      .eq('is_active', true)
      .single()

    if (existingShare) {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflect.com'}/share/${existingShare.share_id}`
      return NextResponse.json({
        shareId: existingShare.share_id,
        shareUrl,
        existing: true,
      })
    }

    // Generate a short, URL-friendly share ID
    const shareId = nanoid(10)

    // Create share record
    const { data, error } = await supabase
      .from('shared_reflections')
      .insert({
        share_id: shareId,
        user_id: user.id,
        reflection_id,
        share_excerpt: share_excerpt || null,
      })
      .select('share_id')
      .single()

    if (error) {
      console.error('Failed to create share:', error)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflect.com'}/share/${data.share_id}`

    return NextResponse.json({
      shareId: data.share_id,
      shareUrl,
    })
  } catch (error) {
    console.error('Share create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/share - Get user's shared reflections
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('shared_reflections')
      .select(`
        *,
        reflections (
          id,
          date,
          mood_rating,
          what_worked,
          sessions (title)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch shares:', error)
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
    }

    return NextResponse.json({ shares: data })
  } catch (error) {
    console.error('Share fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/share - Deactivate a share
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { share_id } = await request.json()

    if (!share_id) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('shared_reflections')
      .update({ is_active: false })
      .eq('share_id', share_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete share:', error)
      return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Share delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
