import { createClient } from '@/lib/supabase/server'
import { hasActiveSubscription } from '@/lib/subscription'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// POST - Save a drill (Pro only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isPro = await hasActiveSubscription(user.id)
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, ageGroup, type, setPieceType, drillData } = body

    if (!name || !drillData) {
      return NextResponse.json({ error: 'Name and drill data are required' }, { status: 400 })
    }

    const shareId = nanoid(10)

    const { data, error } = await supabase
      .from('saved_drills')
      .insert({
        user_id: user.id,
        share_id: shareId,
        name,
        description: description || null,
        category: category || 'technical',
        age_group: ageGroup || null,
        type: type || 'drill',
        set_piece_type: setPieceType || null,
        drill_data: drillData,
      })
      .select('id, share_id, name, category, type, is_favourite, created_at')
      .single()

    if (error) {
      console.error('Failed to save drill:', error)
      return NextResponse.json({ error: 'Failed to save drill' }, { status: 500 })
    }

    return NextResponse.json({ drill: data })
  } catch (error) {
    console.error('Save drill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List user's drills with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const favourite = searchParams.get('favourite')
    const search = searchParams.get('search')

    let query = supabase
      .from('saved_drills')
      .select('id, share_id, name, description, category, age_group, type, set_piece_type, drill_data, is_favourite, view_count, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }
    if (favourite === 'true') {
      query = query.eq('is_favourite', true)
    }
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('Failed to fetch drills:', error)
      return NextResponse.json({ error: 'Failed to fetch drills' }, { status: 500 })
    }

    return NextResponse.json({ drills: data || [] })
  } catch (error) {
    console.error('Fetch drills error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
