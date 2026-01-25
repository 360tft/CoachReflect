import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from '../components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

interface StreakEmailProps {
  name: string
  unsubscribeUrl?: string
}

// 3-Day Streak
export function Streak3Email({ name, unsubscribeUrl }: StreakEmailProps) {
  return (
    <BaseLayout
      preview="3-day reflection streak!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={streakBadge}>
        <Text style={streakNumber}>3</Text>
        <Text style={streakLabel}>Day Streak!</Text>
      </Section>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Three days of reflection - you're building momentum!
      </Text>

      <Text style={paragraph}>
        Research shows it takes about 3 weeks to form a habit. You're on your way.
        Keep going and you'll start seeing patterns in your coaching that you never
        noticed before.
      </Text>

      <Section style={tipBox}>
        <Text style={tipText}>
          <strong>Quick tip:</strong> Set a reminder right after your regular
          session time. Make reflection part of your routine.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard`} style={button}>
          Keep the Streak Going
        </Button>
      </Section>

      <Text style={paragraph}>Nice work!</Text>
    </BaseLayout>
  )
}

// 7-Day Streak
export function Streak7Email({ name, unsubscribeUrl }: StreakEmailProps) {
  return (
    <BaseLayout
      preview="One week of reflections!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={streakBadge}>
        <Text style={streakNumber}>7</Text>
        <Text style={streakLabel}>Day Streak!</Text>
      </Section>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        A full week of reflecting on your coaching. That's impressive.
      </Text>

      <Text style={paragraph}>
        Most coaches never take time to do this. You're already ahead of the
        curve. By now, you might be noticing:
      </Text>

      <ul style={list}>
        <li>Recurring themes in your sessions</li>
        <li>Players who keep showing up in your notes</li>
        <li>Patterns in what works and what doesn't</li>
      </ul>

      <Section style={tipBox}>
        <Text style={tipText}>
          <strong>Pro tip:</strong> Check your weekly summary in the Analytics
          section. See what the AI has spotted that you might have missed.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/analytics`} style={button}>
          View Your Analytics
        </Button>
      </Section>

      <Text style={paragraph}>Keep it up!</Text>
    </BaseLayout>
  )
}

// 14-Day Streak
export function Streak14Email({ name, unsubscribeUrl }: StreakEmailProps) {
  return (
    <BaseLayout
      preview="Two weeks strong!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={streakBadge}>
        <Text style={streakNumber}>14</Text>
        <Text style={streakLabel}>Day Streak!</Text>
      </Section>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Two weeks straight. This is no longer a try-out - it's becoming part of
        who you are as a coach.
      </Text>

      <Text style={paragraph}>
        At this point, you've got a proper dataset. Your reflections aren't just
        notes - they're evidence of your coaching journey. In a year's time,
        you'll be able to look back and see how far you've come.
      </Text>

      <Section style={tipBox}>
        <Text style={tipText}>
          <strong>Think about:</strong> What's the one thing you've learned
          about yourself as a coach in the last two weeks?
        </Text>
      </Section>

      <Text style={paragraph}>
        Seriously - we're impressed. Most people don't stick with new habits
        this long.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard`} style={button}>
          Continue Your Journey
        </Button>
      </Section>
    </BaseLayout>
  )
}

// 30-Day Streak
export function Streak30Email({ name, unsubscribeUrl }: StreakEmailProps) {
  return (
    <BaseLayout
      preview="30-day reflection streak!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={streakBadge}>
        <Text style={{ ...streakNumber, fontSize: '64px' }}>30</Text>
        <Text style={{ ...streakLabel, fontSize: '24px' }}>Day Streak!</Text>
      </Section>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        <strong>Thirty days.</strong> A full month of intentional reflection.
      </Text>

      <Text style={paragraph}>
        You've officially crossed from "trying something new" to "this is what I
        do." Reflection is now part of your coaching identity.
      </Text>

      <Text style={paragraph}>Here's what you've built:</Text>

      <ul style={list}>
        <li>A searchable log of 30+ sessions</li>
        <li>Patterns the AI has identified across your coaching</li>
        <li>Evidence of your development as a coach</li>
        <li>A habit that separates good coaches from great ones</li>
      </ul>

      <Section style={highlightBox}>
        <Text style={highlightText}>
          You're in the top 1% of coaches who actually take time to reflect
          consistently.
        </Text>
      </Section>

      <Text style={paragraph}>
        We're genuinely proud to have you as part of Coach Reflection. Keep
        going - the insights only get richer from here.
      </Text>

      <Section style={buttonContainer}>
        <Button
          href={`${APP_URL}/dashboard/analytics`}
          style={{ ...button, backgroundColor: '#1f2937' }}
        >
          See Your 30-Day Journey
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Shared styles
const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '16px 0',
}

const streakBadge = {
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const streakNumber = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#E5A11C',
  margin: '0',
}

const streakLabel = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#E5A11C',
  margin: '5px 0',
}

const tipBox = {
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
}

const tipText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
}

const highlightBox = {
  backgroundColor: '#E5A11C',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const highlightText = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#E5A11C',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const list = {
  fontSize: '16px',
  lineHeight: '1.8',
  color: '#374151',
  paddingLeft: '20px',
}
