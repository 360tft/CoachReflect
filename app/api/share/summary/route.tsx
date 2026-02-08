import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single()

  // Get this week's stats
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const { count: reflectionCount } = await supabase
    .from('reflections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('date', weekAgoStr)

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', `${weekAgoStr}T00:00:00.000Z`)

  // Get streak
  const { data: streak } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', user.id)
    .single()

  // Get top themes this week
  const { data: themes } = await supabase
    .from('extracted_insights')
    .select('name')
    .eq('user_id', user.id)
    .eq('insight_type', 'theme')
    .gte('created_at', `${weekAgoStr}T00:00:00.000Z`)
    .limit(3)

  const name = profile?.display_name || 'Coach'
  const reflections = reflectionCount || 0
  const messages = messageCount || 0
  const currentStreak = streak?.current_streak || 0
  const topThemes = themes?.map(t => t.name) || []

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#E5A11C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
              }}
            >
              CR
            </div>
            <span style={{ fontSize: '24px', fontWeight: '600' }}>Coach Reflection</span>
          </div>
          <span style={{ fontSize: '18px', color: '#9CA3AF' }}>This Week</span>
        </div>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '20px', color: '#9CA3AF' }}>Weekly Summary for</span>
          <span style={{ fontSize: '40px', fontWeight: '700' }}>{name}</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '56px', fontWeight: '700', color: '#E5A11C' }}>
              {reflections}
            </span>
            <span style={{ fontSize: '18px', color: '#9CA3AF' }}>Reflections</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '56px', fontWeight: '700', color: '#E5A11C' }}>
              {messages}
            </span>
            <span style={{ fontSize: '18px', color: '#9CA3AF' }}>Messages</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '56px', fontWeight: '700', color: '#E5A11C' }}>
              {currentStreak}
            </span>
            <span style={{ fontSize: '18px', color: '#9CA3AF' }}>Day Streak</span>
          </div>
        </div>

        {/* Themes */}
        {topThemes.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', color: '#9CA3AF' }}>Top themes:</span>
            {topThemes.map((theme, i) => (
              <span
                key={i}
                style={{
                  fontSize: '16px',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  background: 'rgba(229, 161, 28, 0.2)',
                  color: '#E5A11C',
                }}
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', color: '#6B7280' }}>coachreflection.com</span>
          <span style={{ fontSize: '16px', color: '#6B7280' }}>by 360TFT</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
