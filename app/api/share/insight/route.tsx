import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters
    const insight = searchParams.get('text') || 'A coaching insight'
    const category = searchParams.get('category') || 'reflection'
    const date = searchParams.get('date') || new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

    // Category styling
    const categoryStyles: Record<string, { bg: string; icon: string }> = {
      reflection: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', icon: '💭' },
      player: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', icon: '⚽' },
      tactical: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', icon: '📋' },
      personal: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: '🎯' },
      development: { bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', icon: '📈' },
    }

    const style = categoryStyles[category] || categoryStyles.reflection

    // Truncate insight if too long
    const truncatedInsight = insight.length > 200
      ? insight.substring(0, 197) + '...'
      : insight

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
              maxWidth: '900px',
              padding: '50px 60px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '32px',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {/* Icon and label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              <span style={{ fontSize: '48px' }}>{style.icon}</span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                Coaching Insight
              </span>
            </div>

            {/* Quote marks */}
            <div
              style={{
                fontSize: '80px',
                color: 'rgba(255,255,255,0.3)',
                lineHeight: '0.5',
                marginBottom: '16px',
              }}
            >
              "
            </div>

            {/* Insight text */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: '500',
                color: 'white',
                lineHeight: '1.4',
                marginBottom: '32px',
              }}
            >
              {truncatedInsight}
            </div>

            {/* Date */}
            <div
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '40px',
              }}
            >
              {date}
            </div>

            {/* Divider */}
            <div
              style={{
                width: '100%',
                height: '2px',
                background: 'rgba(255,255,255,0.2)',
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
    console.error('Insight image generation error:', error)
    return new Response('Failed to generate insight image', { status: 500 })
  }
}
