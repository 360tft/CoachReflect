import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Collect all user data from various tables
    const [
      profileResult,
      reflectionsResult,
      sessionsResult,
      conversationsResult,
      messagesResult,
      memoryResult,
      streaksResult,
      badgesResult,
      feedbackResult,
      sharedReflectionsResult,
    ] = await Promise.all([
      // Profile data
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // Reflections
      supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Sessions
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Conversations
      supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Messages
      supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // AI Memory
      supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // Streaks
      supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // Badges
      supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id),

      // Feedback given
      supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Shared reflections
      supabase
        .from('shared_reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    // Structure the export data
    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profileResult.data ? {
        display_name: profileResult.data.display_name,
        club_name: profileResult.data.club_name,
        age_group: profileResult.data.age_group,
        coaching_level: profileResult.data.coaching_level,
        subscription_tier: profileResult.data.subscription_tier,
        email_notifications_enabled: profileResult.data.email_notifications_enabled,
        created_at: profileResult.data.created_at,
        updated_at: profileResult.data.updated_at,
      } : null,
      coaching_data: {
        reflections: reflectionsResult.data || [],
        sessions: sessionsResult.data || [],
        total_reflections: reflectionsResult.data?.length || 0,
        total_sessions: sessionsResult.data?.length || 0,
      },
      conversations: {
        conversations: conversationsResult.data || [],
        messages: messagesResult.data || [],
        total_conversations: conversationsResult.data?.length || 0,
        total_messages: messagesResult.data?.length || 0,
      },
      ai_memory: memoryResult.data || null,
      gamification: {
        streaks: streaksResult.data || null,
        badges: badgesResult.data || [],
      },
      feedback_given: feedbackResult.data || [],
      shared_reflections: sharedReflectionsResult.data || [],
    }

    // Return as downloadable JSON
    const jsonString = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="coachreflect-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
