import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

// Badge colors based on category
const BADGE_COLORS: Record<string, { bg: string; accent: string }> = {
  streak: { bg: 'linear-gradient(135deg, #E5A11C 0%, #d97706 100%)', accent: '#fbbf24' },
  reflection: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', accent: '#60a5fa' },
  milestone: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', accent: '#a78bfa' },
  consistency: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', accent: '#34d399' },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters
    const badgeName = searchParams.get('name') || 'Achievement Badge'
    const badgeEmoji = searchParams.get('emoji') || '🏆'
    const badgeDescription = searchParams.get('desc') || 'Earned on CoachReflection'
    const category = (searchParams.get('category') || 'milestone') as keyof typeof BADGE_COLORS
    const streak = searchParams.get('streak')

    const colors = BADGE_COLORS[category] || BADGE_COLORS.milestone

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.bg,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Card container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '60px 80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '32px',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {/* Badge emoji - large */}
            <div
              style={{
                fontSize: '120px',
                marginBottom: '20px',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.2))',
              }}
            >
              {badgeEmoji}
            </div>

            {/* Badge name */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: '16px',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              {badgeName}
            </div>

            {/* Badge description */}
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                maxWidth: '500px',
                marginBottom: '32px',
              }}
            >
              {badgeDescription}
            </div>

            {/* Streak info if applicable */}
            {streak && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 32px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  marginBottom: '32px',
                }}
              >
                <span style={{ fontSize: '32px' }}>
                  {parseInt(streak) >= 30 ? '🏆' : parseInt(streak) >= 7 ? '🔥' : parseInt(streak) >= 3 ? '⚡' : '✨'}
                </span>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    color: 'white',
                  }}
                >
                  {streak} day streak!
                </span>
              </div>
            )}

            {/* Divider */}
            <div
              style={{
                width: '200px',
                height: '2px',
                background: 'rgba(255,255,255,0.3)',
                marginBottom: '24px',
              }}
            />

            {/* Footer branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                CR
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  CoachReflection
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  coachreflection.com
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Badge image generation error:', error)
    return new Response('Failed to generate badge image', { status: 500 })
  }
}
