import {
  Button,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from '../components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

interface WinbackEmailProps {
  name: string
  unsubscribeUrl?: string
}

// Winback email (when user becomes inactive)
export function WinbackEmail({ name, unsubscribeUrl }: WinbackEmailProps) {
  return (
    <BaseLayout
      preview="We noticed you haven't logged a reflection in a while"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        We noticed you haven't logged a reflection in a while. Everything okay?
      </Text>

      <Text style={paragraph}>
        If you're between seasons or taking a break - totally get it.
      </Text>

      <Text style={paragraph}>
        If you've just been busy - your next session is a perfect time to pick
        back up. Even a quick reflection helps.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/reflect/new`} style={button}>
          Quick Reflection
        </Button>
      </Section>

      <Text style={paragraph}>We're here when you're ready.</Text>

      <Text style={{ ...paragraph, fontSize: '14px', color: '#6b7280' }}>
        P.S. Pro coaches get unlimited reflections and voice notes to capture thoughts on the drive home. Free for 7 days if you want to try.
      </Text>
    </BaseLayout>
  )
}

// Winback feature highlight
export function WinbackFeatureEmail({ name, unsubscribeUrl }: WinbackEmailProps) {
  return (
    <BaseLayout
      preview="New: Chat with your coaching AI"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Just wanted to let you know about our newest feature:{' '}
        <strong>Coach Chat</strong>.
      </Text>

      <Text style={paragraph}>
        It's like having a coaching mentor available whenever you need to:
      </Text>

      <ul style={list}>
        <li>Talk through a tricky player situation</li>
        <li>Process what happened in a tough session</li>
        <li>Get ideas for your next training</li>
        <li>Reflect on your coaching journey</li>
      </ul>

      <Text style={paragraph}>
        Give it a try - you've still got free messages available.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/chat`} style={button}>
          Try Coach Chat
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Streak broken email
export function StreakBrokenEmail({ name, unsubscribeUrl }: WinbackEmailProps) {
  return (
    <BaseLayout
      preview="Your reflection streak has ended - but every streak starts with day one"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Your reflection streak has ended - but that's okay! Every great streak
        starts with day one.
      </Text>

      <Text style={paragraph}>
        Here's the thing: consistency matters more than perfection. Even a brief
        reflection after your next session gets you back on track.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/reflect/new`} style={button}>
          Start a New Streak
        </Button>
      </Section>

      <Text style={paragraph}>You've got this.</Text>
    </BaseLayout>
  )
}

// Winback final email (day 7 - last email)
export function WinbackFinalEmail({ name, unsubscribeUrl }: WinbackEmailProps) {
  return (
    <BaseLayout
      preview="Last email about this, promise"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Last email about this, promise.
      </Text>

      <Text style={paragraph}>
        Coach Reflection is still here whenever you need it. Free to use, no
        pressure.
      </Text>

      <Text style={paragraph}>Here's all it takes:</Text>

      <ol style={list}>
        <li>Open the app after your next session</li>
        <li>Chat through what happened (2 minutes)</li>
        <li>Watch your coaching patterns emerge over time</li>
      </ol>

      <Text style={paragraph}>
        That's it. Just a tool to help you grow.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/chat`} style={button}>
          Open Coach Reflection
        </Button>
      </Section>

      <Text style={{ ...paragraph, fontSize: '14px', color: '#6b7280' }}>
        P.S. If you do come back, Pro gives you unlimited reflections and voice notes. 7-day free trial, cancel anytime.
      </Text>

      <Text style={paragraph}>
        Kev
      </Text>
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
