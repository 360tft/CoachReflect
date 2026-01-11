import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Admin client for inserting events (needed for anonymous tracking)
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      event_type,
      event_category,
      event_data = {},
      session_id,
    } = body

    if (!event_type || !event_category) {
      return NextResponse.json(
        { error: 'event_type and event_category required' },
        { status: 400 }
      )
    }

    // Try to get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client to insert (bypasses RLS for anonymous events)
    const adminClient = getAdminClient()

    const eventData = {
      user_id: user?.id || null,
      session_id: session_id || null,
      event_type,
      event_category,
      event_data,
      device_info: {
        user_agent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
      },
    }

    const { error } = await adminClient
      .from('events')
      .insert(eventData)

    if (error) {
      console.error('Event tracking error:', error)
      // Don't return error to client - tracking should fail silently
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track error:', error)
    // Always return success to not block user experience
    return NextResponse.json({ success: true })
  }
}

// GET - Fetch events for admin analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    const category = searchParams.get('category')

    const since = new Date()
    since.setDate(since.getDate() - days)

    let query = supabase
      .from('events')
      .select('event_type, event_category, created_at, event_data')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000)

    if (category) {
      query = query.eq('event_category', category)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Events fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Aggregate by event type
    const aggregated = events?.reduce((acc, event) => {
      const key = `${event.event_category}:${event.event_type}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      events: events || [],
      aggregated: aggregated || {},
      total: events?.length || 0,
    })
  } catch (error) {
    console.error('Track GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
