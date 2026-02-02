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

    // Build query - profiles table doesn't have email, so we get profiles first
    let query = adminClient
      .from('profiles')
      .select(`
        id,
        user_id,
        display_name,
        subscription_tier,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search && search.length >= 2) {
      const escapedSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.ilike('display_name', `%${escapedSearch}%`)
    }

    const { data: profiles, count, error } = await query

    if (error) throw error

    // Get user_ids for related queries
    const userIds = profiles?.map(p => p.user_id) || []

    // Get emails from auth.users in a single batch call
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const userEmails: Record<string, string> = {}
    for (const authUser of authUsers.users) {
      if (authUser.email && userIds.includes(authUser.id)) {
        userEmails[authUser.id] = authUser.email
      }
    }

    // If searching by email, filter profiles that match
    let filteredProfiles = profiles || []
    if (search && search.length >= 2) {
      const searchLower = search.toLowerCase()
      filteredProfiles = filteredProfiles.filter(p =>
        (p.display_name?.toLowerCase().includes(searchLower)) ||
        (userEmails[p.user_id]?.toLowerCase().includes(searchLower))
      )
    }

    // Count reflections per user (only if we have userIds)
    let reflectionsByUser: Record<string, number> = {}
    if (userIds.length > 0) {
      const { data: reflectionCounts } = await adminClient
        .from('reflections')
        .select('user_id')
        .in('user_id', userIds)

      reflectionsByUser = (reflectionCounts || []).reduce((acc, r) => {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Count conversations per user (only if we have userIds)
    let conversationsByUser: Record<string, number> = {}
    if (userIds.length > 0) {
      const { data: conversationCounts } = await adminClient
        .from('conversations')
        .select('user_id')
        .in('user_id', userIds)

      conversationsByUser = (conversationCounts || []).reduce((acc, c) => {
        acc[c.user_id] = (acc[c.user_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Get streak info (only if we have userIds)
    let streaksByUser: Record<string, number> = {}
    if (userIds.length > 0) {
      const { data: streaks } = await adminClient
        .from('streaks')
        .select('user_id, current_streak')
        .in('user_id', userIds)

      streaksByUser = (streaks || []).reduce((acc, s) => {
        acc[s.user_id] = s.current_streak
        return acc
      }, {} as Record<string, number>)
    }

    // Combine data - use user_id for lookups, add email from auth
    const users = filteredProfiles.map(profile => ({
      id: profile.user_id, // Use user_id as the id for frontend
      email: userEmails[profile.user_id] || 'Unknown',
      display_name: profile.display_name,
      subscription_tier: profile.subscription_tier,
      created_at: profile.created_at,
      total_reflections: reflectionsByUser[profile.user_id] || 0,
      total_conversations: conversationsByUser[profile.user_id] || 0,
      current_streak: streaksByUser[profile.user_id] || 0,
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
