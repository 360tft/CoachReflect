import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check admin access
    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get recent limit hits
    const { data: hits, error: hitsError } = await supabase
      .from('limit_hits')
      .select(`
        id,
        user_id,
        hit_date,
        limit_type,
        daily_limit,
        created_at,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (hitsError) {
      // If table doesn't exist, return empty data
      if (hitsError.code === '42P01') {
        return NextResponse.json({
          hits: [],
          stats: {
            total_hits: 0,
            unique_users_all_time: 0,
            unique_users_last_30_days: 0,
            power_users: []
          }
        })
      }
      throw hitsError
    }

    // Format hits with email
    const formattedHits = (hits || []).map(hit => ({
      id: hit.id,
      user_id: hit.user_id,
      user_email: (hit.profiles as { email?: string })?.email || null,
      hit_date: hit.hit_date,
      limit_type: hit.limit_type,
      daily_limit: hit.daily_limit,
      created_at: hit.created_at
    }))

    // Calculate stats
    const uniqueUsersAllTime = new Set(formattedHits.map(h => h.user_id)).size

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentHits = formattedHits.filter(h => new Date(h.created_at) >= thirtyDaysAgo)
    const uniqueUsersLast30Days = new Set(recentHits.map(h => h.user_id)).size

    // Calculate power users (3+ hits)
    const userHitCounts: Record<string, { email: string | null; count: number }> = {}
    formattedHits.forEach(hit => {
      if (!userHitCounts[hit.user_id]) {
        userHitCounts[hit.user_id] = { email: hit.user_email, count: 0 }
      }
      userHitCounts[hit.user_id].count++
    })

    const powerUsers = Object.entries(userHitCounts)
      .filter(([, data]) => data.count >= 3)
      .map(([userId, data]) => ({
        user_id: userId,
        email: data.email,
        times_hit: data.count
      }))
      .sort((a, b) => b.times_hit - a.times_hit)

    return NextResponse.json({
      hits: formattedHits,
      stats: {
        total_hits: formattedHits.length,
        unique_users_all_time: uniqueUsersAllTime,
        unique_users_last_30_days: uniqueUsersLast30Days,
        power_users: powerUsers
      }
    })
  } catch (error) {
    console.error('Error fetching limit hits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch limit hits' },
      { status: 500 }
    )
  }
}
