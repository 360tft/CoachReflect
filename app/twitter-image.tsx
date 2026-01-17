import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'CoachReflect - AI-Powered Reflection for Sports Coaches'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
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
          backgroundColor: '#0A0A0A',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #1a1a1a 0%, transparent 50%), radial-gradient(circle at 75% 75%, #262617 0%, transparent 50%)',
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #E5A11C 0%, #CC8F17 100%)',
            borderRadius: 16,
            fontSize: 40,
            fontWeight: 'bold',
            color: 'white',
          }}
        >
          CR
        </div>

        {/* Logo text */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 16,
            letterSpacing: '-2px',
          }}
        >
          Coach
          <span style={{ color: '#E5A11C' }}>Reflect</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#94a3b8',
            marginBottom: 40,
            textAlign: 'center',
          }}
        >
          AI-Powered Reflection for Sports Coaches
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#cbd5e1',
              fontSize: 22,
            }}
          >
            <span style={{ color: '#E5A11C' }}>•</span> Session Reviews
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#cbd5e1',
              fontSize: 22,
            }}
          >
            <span style={{ color: '#E5A11C' }}>•</span> Track Progress
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#cbd5e1',
              fontSize: 22,
            }}
          >
            <span style={{ color: '#E5A11C' }}>•</span> AI Insights
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            fontSize: 20,
            color: '#64748b',
          }}
        >
          by 360TFT
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
