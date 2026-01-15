import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminUser } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const rawSearch = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // Sanitize search input
    const search = rawSearch.replace(/[^a-zA-Z0-9@.\-_\s]/g, '').slice(0, 100)

    // Build query
    let query = adminClient
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        subscription_tier,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search && search.length >= 2) {
      const escapedSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`email.ilike.%${escapedSearch}%,display_name.ilike.%${escapedSearch}%`)
    }

    const { data: profiles, count, error } = await query

    if (error) throw error

    // Get reflection counts for each user
    const userIds = profiles?.map(p => p.id) || []

    // Count reflections per user
    const { data: reflectionCounts } = await adminClient
      .from('reflections')
      .select('user_id')
      .in('user_id', userIds)

    const reflectionsByUser = (reflectionCounts || []).reduce((acc, r) => {
      acc[r.user_id] = (acc[r.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Count conversations per user
    const { data: conversationCounts } = await adminClient
      .from('conversations')
      .select('user_id')
      .in('user_id', userIds)

    const conversationsByUser = (conversationCounts || []).reduce((acc, c) => {
      acc[c.user_id] = (acc[c.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get streak info
    const { data: streaks } = await adminClient
      .from('streaks')
      .select('user_id, current_streak')
      .in('user_id', userIds)

    const streaksByUser = (streaks || []).reduce((acc, s) => {
      acc[s.user_id] = s.current_streak
      return acc
    }, {} as Record<string, number>)

    // Combine data
    const users = profiles?.map(profile => ({
      ...profile,
      total_reflections: reflectionsByUser[profile.id] || 0,
      total_conversations: conversationsByUser[profile.id] || 0,
      current_streak: streaksByUser[profile.id] || 0,
    }))

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
