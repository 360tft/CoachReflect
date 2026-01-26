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
    const rating = searchParams.get('rating')
    const offset = (page - 1) * limit

    // Build query
    let query = adminClient
      .from('feedback')
      .select(`
        id,
        user_id,
        message_content,
        response_content,
        rating,
        comment,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (rating === 'positive' || rating === 'negative') {
      query = query.eq('rating', rating)
    }

    const { data: feedback, count, error } = await query

    if (error) throw error

    // Get user info for each feedback
    const userIds = [...new Set(feedback?.map(f => f.user_id) || [])]

    // Get profiles by user_id (not id)
    let profilesByUserId: Record<string, { user_id: string; display_name: string | null }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      profilesByUserId = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p
        return acc
      }, {} as Record<string, { user_id: string; display_name: string | null }>)
    }

    // Get emails from auth.users
    const userEmails: Record<string, string> = {}
    for (const userId of userIds) {
      const { data: userData } = await adminClient.auth.admin.getUserById(userId)
      if (userData?.user?.email) {
        userEmails[userId] = userData.user.email
      }
    }

    // Combine feedback with user info
    const feedbackWithUsers = feedback?.map(f => ({
      ...f,
      user_email: userEmails[f.user_id] || 'Unknown',
      user_name: profilesByUserId[f.user_id]?.display_name || 'Anonymous',
    }))

    // Get counts
    const { data: allFeedback } = await adminClient
      .from('feedback')
      .select('rating')

    const positive = allFeedback?.filter(f => f.rating === 'positive').length || 0
    const negative = allFeedback?.filter(f => f.rating === 'negative').length || 0

    return NextResponse.json({
      feedback: feedbackWithUsers,
      counts: {
        positive,
        negative,
        total: positive + negative,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Admin feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
