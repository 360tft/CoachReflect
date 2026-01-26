import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Get streak milestone styling
function getStreakStyle(days: number) {
  if (days >= 30) {
    return {
      bg: 'linear-gradient(135deg, #E5A11C 0%, #92400e 100%)',
      emoji: '🏆',
      title: 'Legendary Coach',
      subtitle: '30+ days of intentional reflection',
    }
  }
  if (days >= 14) {
    return {
      bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      emoji: '🔥',
      title: 'Committed Coach',
      subtitle: 'Two weeks of reflection!',
    }
  }
  if (days >= 7) {
    return {
      bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      emoji: '⚡',
      title: 'On Fire',
      subtitle: 'One week strong!',
    }
  }
  if (days >= 3) {
    return {
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      emoji: '✨',
      title: 'Building Momentum',
      subtitle: 'Keep it going!',
    }
  }
  return {
    bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    emoji: '🌱',
    title: 'Getting Started',
    subtitle: 'Every journey begins with one step',
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters
    const days = parseInt(searchParams.get('days') || '1', 10)
    const name = searchParams.get('name') || ''

    const style = getStreakStyle(days)

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
            background: style.bg,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Main card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '60px 100px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '32px',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {/* Emoji */}
            <div
              style={{
                fontSize: '100px',
                marginBottom: '16px',
              }}
            >
              {style.emoji}
            </div>

            {/* Streak number */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '120px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  lineHeight: '1',
                }}
              >
                {days}
              </span>
              <span
                style={{
                  fontSize: '40px',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                day{days !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '8px',
              }}
            >
              {style.title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '40px',
              }}
            >
              {style.subtitle}
            </div>

            {/* Name if provided */}
            {name && (
              <div
                style={{
                  fontSize: '20px',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '40px',
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              >
                Achieved by {name}
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
                  Coach Reflection
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Reflection streak
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
    console.error('Streak image generation error:', error)
    return new Response('Failed to generate streak image', { status: 500 })
  }
}
