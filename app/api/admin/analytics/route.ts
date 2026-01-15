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
    const period = searchParams.get('period') || '7d'

    // Calculate date range
    const now = new Date()
    let startDate: Date | null = null

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get total reflections
    let reflectionsQuery = adminClient.from('reflections').select('*', { count: 'exact', head: true })
    if (startDate) {
      reflectionsQuery = reflectionsQuery.gte('created_at', startDate.toISOString())
    }
    const { count: totalReflections } = await reflectionsQuery

    // Get total conversations
    let conversationsQuery = adminClient.from('conversations').select('*', { count: 'exact', head: true })
    if (startDate) {
      conversationsQuery = conversationsQuery.gte('created_at', startDate.toISOString())
    }
    const { count: totalConversations } = await conversationsQuery

    // Get unique active users (7d)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const { data: active7d } = await adminClient
      .from('reflections')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString())

    const uniqueActiveUsers7d = new Set(active7d?.map(r => r.user_id) || []).size

    // Get unique active users (30d)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const { data: active30d } = await adminClient
      .from('reflections')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const uniqueActiveUsers30d = new Set(active30d?.map(r => r.user_id) || []).size

    // Get total users for averages
    const { count: totalUsers } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Calculate averages
    const avgReflectionsPerUser = totalUsers && totalUsers > 0 ? (totalReflections || 0) / totalUsers : 0
    const avgConversationsPerUser = totalUsers && totalUsers > 0 ? (totalConversations || 0) / totalUsers : 0

    // Get reflections by day for the period
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 30
    const reflectionsByDay: Array<{ date: string; count: number }> = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const { count } = await adminClient
        .from('reflections')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())

      reflectionsByDay.push({
        date: dayStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        count: count || 0,
      })
    }

    // Get top moods
    const { data: moods } = await adminClient
      .from('reflections')
      .select('mood')
      .not('mood', 'is', null)

    const moodCounts = (moods || []).reduce((acc, r) => {
      if (r.mood) {
        acc[r.mood] = (acc[r.mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topMoods = Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Conversion funnel
    const { count: signups } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Users with at least 1 reflection
    const { data: usersWithReflections } = await adminClient
      .from('reflections')
      .select('user_id')

    const usersWithAnyReflection = new Set(usersWithReflections?.map(r => r.user_id) || [])

    // Count reflections per user to find those with 3+
    const reflectionCountByUser = (usersWithReflections || []).reduce((acc, r) => {
      acc[r.user_id] = (acc[r.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const usersWithThreePlus = Object.values(reflectionCountByUser).filter(count => count >= 3).length

    // Pro subscribers
    const { count: proSubscribed } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier', 'pro')

    return NextResponse.json({
      summary: {
        totalReflections: totalReflections || 0,
        totalConversations: totalConversations || 0,
        uniqueActiveUsers7d,
        uniqueActiveUsers30d,
        avgReflectionsPerUser,
        avgConversationsPerUser,
      },
      reflectionsByDay,
      topMoods,
      conversionFunnel: {
        signups: signups || 0,
        firstReflection: usersWithAnyReflection.size,
        threeReflections: usersWithThreePlus,
        proSubscribed: proSubscribed || 0,
      },
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
