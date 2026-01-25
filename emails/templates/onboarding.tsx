import {
  Button,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from '../components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

interface OnboardingEmailProps {
  name: string
  unsubscribeUrl?: string
}

// Welcome email (Day 0)
export function WelcomeEmail({ name, unsubscribeUrl }: OnboardingEmailProps) {
  return (
    <BaseLayout
      preview="Welcome to Coach Reflection - start your first reflection"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Welcome to Coach Reflection! You've taken the first step toward becoming
        a more intentional coach.
      </Text>

      <Text style={paragraph}>Here's how to get started:</Text>

      <Section style={stepBox}>
        <Text style={stepText}>
          <strong>1. Complete your first reflection</strong>
          <br />
          Just 2 minutes after your next session
        </Text>
      </Section>

      <Section style={stepBox}>
        <Text style={stepText}>
          <strong>2. Be honest</strong>
          <br />
          This is your private space to grow
        </Text>
      </Section>

      <Section style={stepBox}>
        <Text style={stepText}>
          <strong>3. Watch the patterns emerge</strong>
          <br />
          Over time, you'll see what makes you effective
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/reflect/new`} style={button}>
          Start Your First Reflection
        </Button>
      </Section>

      <Text style={paragraph}>
        Here's to your growth,
        <br />
        The Coach Reflection Team
      </Text>
    </BaseLayout>
  )
}

// First reflection nudge (Day 1)
export function FirstReflectionEmail({ name, unsubscribeUrl }: OnboardingEmailProps) {
  return (
    <BaseLayout
      preview="Your first reflection takes 2 minutes"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Have you had a session since signing up? If so, take 2 minutes to capture
        your thoughts.
      </Text>

      <Text style={paragraph}>The questions are simple:</Text>

      <ul style={list}>
        <li>What worked well?</li>
        <li>What didn't go as planned?</li>
        <li>Any player standouts?</li>
        <li>What will you focus on next?</li>
      </ul>

      <Text style={paragraph}>
        That's it. No pressure to write essays - even a few words per question
        builds your coaching history.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/reflect/new`} style={button}>
          Add a Reflection
        </Button>
      </Section>

      <Text style={paragraph}>
        Keep growing,
        <br />
        The Coach Reflection Team
      </Text>
    </BaseLayout>
  )
}

// Reflection tips (Day 3)
export function ReflectionTipsEmail({ name, unsubscribeUrl }: OnboardingEmailProps) {
  return (
    <BaseLayout
      preview="3 questions that unlock coaching growth"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Here are 3 reflection questions that coaches tell us make the biggest
        difference:
      </Text>

      <Section style={tipBox}>
        <Text style={tipText}>
          <strong>"What would I do differently?"</strong>
          <br />
          <span style={{ color: '#6b7280' }}>
            The honest answer here is gold for next time
          </span>
        </Text>
      </Section>

      <Section style={tipBox}>
        <Text style={tipText}>
          <strong>"Which player surprised me today?"</strong>
          <br />
          <span style={{ color: '#6b7280' }}>
            Track individual development over time
          </span>
        </Text>
      </Section>

      <Section style={tipBox}>
        <Text style={tipText}>
          <strong>"How did I feel during the session?"</strong>
          <br />
          <span style={{ color: '#6b7280' }}>Spot burnout before it hits</span>
        </Text>
      </Section>

      <Text style={paragraph}>
        The best reflection is the one you actually do. Keep it simple.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard`} style={button}>
          Go to Dashboard
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Check-in (Day 7)
export function CheckInEmail({ name, unsubscribeUrl }: OnboardingEmailProps) {
  return (
    <BaseLayout
      preview="How are your reflections going?"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        It's been a week since you joined Coach Reflection. How's it going?
      </Text>

      <Text style={paragraph}>
        If you've been reflecting regularly - brilliant! You're building a
        valuable coaching log.
      </Text>

      <Text style={paragraph}>
        If you haven't had time yet - no worries. Even one reflection per week
        compounds over time.
      </Text>

      <Text style={paragraph}>
        Quick reminder: The "Coach Chat" feature lets you talk through challenges
        with an AI coaching partner. It's like having a mentor available 24/7.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/chat`} style={button}>
          Try Coach Chat
        </Button>
      </Section>

      <Text style={paragraph}>Questions? Just reply to this email.</Text>
    </BaseLayout>
  )
}

// Upgrade pitch (Day 14)
export function UpgradePitchEmail({ name, unsubscribeUrl }: OnboardingEmailProps) {
  return (
    <BaseLayout
      preview="Ready for AI-powered coaching insights?"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        You've been using Coach Reflection for a couple of weeks now. Ready to
        unlock the full potential?
      </Text>

      <Text style={paragraph}>
        <strong>With Pro ($7.99/month), you get:</strong>
      </Text>

      <ul style={list}>
        <li>Unlimited reflections</li>
        <li>AI-powered insights that spot patterns across your sessions</li>
        <li>Session plan upload with automatic analysis</li>
        <li>Unlimited coaching conversations</li>
      </ul>

      <Text style={paragraph}>
        Most coaches say the AI insights alone are worth it - they notice things
        you might miss.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/settings`} style={button}>
          Upgrade to Pro
        </Button>
      </Section>

      <Text style={paragraph}>Either way, keep reflecting. It's working.</Text>
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

const stepBox = {
  backgroundColor: '#fef3c7',
  padding: '15px 20px',
  borderRadius: '8px',
  margin: '15px 0',
}

const stepText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
  lineHeight: '1.5',
}

const tipBox = {
  backgroundColor: '#f3f4f6',
  padding: '15px',
  borderRadius: '8px',
  margin: '15px 0',
}

const tipText = {
  fontSize: '14px',
  color: '#374151',
  margin: '0',
  lineHeight: '1.5',
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
