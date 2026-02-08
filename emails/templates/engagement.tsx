import {
  Button,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from '../components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

interface EngagementEmailProps {
  name: string
  unsubscribeUrl?: string
}

// Last Chance Email (Day 21 - discount offer)
export function LastChanceEmail({ name, unsubscribeUrl }: EngagementEmailProps) {
  return (
    <BaseLayout
      preview="Thanks for trying Coach Reflection"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        You've been using Coach Reflection for 3 weeks now.
      </Text>

      <Text style={paragraph}>
        Just wanted to say thanks for giving it a go.
      </Text>

      <Text style={paragraph}>
        I built this because I know how hard it is to find time to reflect.
        Between sessions, player development, and everything else, reflection
        often gets pushed aside.
      </Text>

      <Text style={paragraph}>
        If the free version is enough for you, keep using it. That's fine.
      </Text>

      <Text style={paragraph}>
        But if you want voice notes, AI insights, and unlimited reflections,
        I've got a thank you for sticking around:
      </Text>

      <Section style={offerBox}>
        <Text style={offerTitle}>20% off your first month of Pro</Text>
        <Text style={offerCode}>Use code THANKYOU20 at checkout</Text>
        <Text style={offerPrice}>That's $6.39 instead of $7.99.</Text>
        <Text style={offerDetails}>Voice notes. AI insights. Unlimited reflections.</Text>
        <Text style={offerExpiry}>Offer expires in 48 hours.</Text>
      </Section>

      <Text style={paragraph}>
        Thanks again for being here.
      </Text>

      <Text style={signature}>Kev</Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/settings`} style={buttonOffer}>
          Claim Your Discount
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Power User Email (for highly engaged users)
export function PowerUserEmail({ name, unsubscribeUrl }: EngagementEmailProps) {
  return (
    <BaseLayout
      preview="You're one of our most active coaches"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Quick note to say: you're crushing it.
      </Text>

      <Text style={paragraph}>
        You're one of our most active coaches on Coach Reflection. Your
        consistency with reflections puts you in the top 5% of users.
      </Text>

      <Text style={paragraph}>
        That kind of intentional practice is what separates good coaches from
        great ones. And we see it in the data - coaches who reflect regularly
        report more confidence and better player outcomes.
      </Text>

      <Section style={highlightBox}>
        <Text style={highlightText}>
          Keep it up. You're building something valuable.
        </Text>
      </Section>

      <Text style={paragraph}>
        If you ever have feedback or feature requests, just reply to this email.
        We read everything and genuinely want to make this better for coaches
        like you.
      </Text>

      <Text style={signature}>Kev</Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/analytics`} style={button}>
          View Your Progress
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Inactive Reengagement (different from winback - for users who signed up but never started)
export function InactiveReengagementEmail({ name, unsubscribeUrl }: EngagementEmailProps) {
  return (
    <BaseLayout
      preview="Still there?"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Noticed you haven't used Coach Reflection for a bit.
      </Text>

      <Text style={paragraph}>
        No problem. Coaching life gets busy.
      </Text>

      <Text style={paragraph}>
        Just wanted to remind you it's there when you need it.
      </Text>

      <Text style={paragraph}>
        <strong>Here are some quick prompts if you're stuck for ideas:</strong>
      </Text>

      <Section style={promptBox}>
        <Text style={promptText}>• "What went well in my last session?"</Text>
        <Text style={promptText}>• "Which player showed the most growth recently?"</Text>
        <Text style={promptText}>• "What's one thing I'd do differently next time?"</Text>
      </Section>

      <Text style={paragraph}>
        Takes 2 minutes. Might change how you approach your next session.
      </Text>

      <Text style={paragraph}>
        Your free reflections are waiting.
      </Text>

      <Text style={signature}>Kev</Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/reflect/new`} style={button}>
          Add a Reflection
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Social Proof Email
export function SocialProofEmail({ name, unsubscribeUrl }: EngagementEmailProps) {
  return (
    <BaseLayout
      preview="What other coaches are saying"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Thought you'd like to see what other coaches are saying about
        reflection:
      </Text>

      <Section style={quoteBox}>
        <Text style={quoteText}>
          "I used to think I didn't have time to reflect. Now I realise I didn't
          have time NOT to. The patterns I've spotted in my coaching have
          changed how I approach every session."
        </Text>
        <Text style={quoteName}>— Academy coach, England</Text>
      </Section>

      <Section style={quoteBox}>
        <Text style={quoteText}>
          "The voice notes are a game-changer. I record my thoughts on the drive
          home and the AI turns them into structured insights."
        </Text>
        <Text style={quoteName}>— Grassroots coach, Scotland</Text>
      </Section>

      <Section style={quoteBox}>
        <Text style={quoteText}>
          "After 30 days of reflection, I can actually see my development as a
          coach. That's something I've never had before."
        </Text>
        <Text style={quoteName}>— Youth coach, Ireland</Text>
      </Section>

      <Text style={paragraph}>
        You're part of a growing community of coaches who take their development
        seriously.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard`} style={button}>
          Continue Your Journey
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Feature Highlight - Voice Notes
export function FeatureHighlightVoiceEmail({ name, unsubscribeUrl }: EngagementEmailProps) {
  return (
    <BaseLayout
      preview="Reflect without typing - try voice notes"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        You've been typing your reflections. That works great.
      </Text>

      <Text style={paragraph}>
        But have you tried voice notes?
      </Text>

      <Section style={featureBox}>
        <Text style={featureTitle}>Voice Notes (Pro feature)</Text>
        <Text style={featureText}>• Record your thoughts on the drive home</Text>
        <Text style={featureText}>• AI transcribes and structures automatically</Text>
        <Text style={featureText}>• Capture more detail when typing feels like a chore</Text>
        <Text style={featureText}>• 4 voice notes per month with Pro</Text>
      </Section>

      <Text style={paragraph}>
        Some coaches find they capture twice as much insight when they can just
        talk instead of type.
      </Text>

      <Text style={paragraph}>
        Worth trying if you ever feel like you have more to say than you write.
      </Text>

      <Text style={signature}>Kev</Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/settings`} style={button}>
          See Pro Features
        </Button>
      </Section>
    </BaseLayout>
  )
}

// Feature Highlight - Analytics
export function FeatureHighlightAnalyticsEmail({ name, unsubscribeUrl }: EngagementEmailProps) {
  return (
    <BaseLayout
      preview="Your coaching data is building up - here's what to look for"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        You've logged a few reflections now. Your coaching data is building up.
      </Text>

      <Text style={paragraph}>
        Have you checked your Analytics section recently?
      </Text>

      <Section style={featureBox}>
        <Text style={featureTitle}>What Analytics Shows You</Text>
        <Text style={featureText}>• Mood patterns across your sessions</Text>
        <Text style={featureText}>• Which days you coach best</Text>
        <Text style={featureText}>• Players who appear most in your notes</Text>
        <Text style={featureText}>• Themes the AI has spotted in your reflections</Text>
      </Section>

      <Text style={paragraph}>
        The more you reflect, the richer the insights get. After about 10
        reflections, the patterns start to get interesting.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/analytics`} style={button}>
          View Your Analytics
        </Button>
      </Section>

      <Text style={paragraph}>Keep reflecting!</Text>
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

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '24px 0 16px',
  fontWeight: '500' as const,
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

const buttonOffer = {
  ...button,
  backgroundColor: '#f59e0b',
}

// Offer box styles
const offerBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #f59e0b',
}

const offerTitle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: '700' as const,
  margin: '0 0 8px',
}

const offerCode = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '700' as const,
  margin: '0 0 12px',
  backgroundColor: '#ffffff',
  padding: '8px 16px',
  borderRadius: '6px',
  display: 'inline-block' as const,
}

const offerPrice = {
  color: '#374151',
  fontSize: '15px',
  margin: '12px 0 4px',
}

const offerDetails = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 12px',
}

const offerExpiry = {
  color: '#dc2626',
  fontSize: '13px',
  fontWeight: '600' as const,
  margin: '0',
}

// Highlight box
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

// Prompt box
const promptBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
}

const promptText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '0',
}

// Quote box
const quoteBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
  borderLeft: '4px solid #E5A11C',
}

const quoteText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px',
  fontStyle: 'italic' as const,
}

const quoteName = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

// Feature box
const featureBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
  borderLeft: '4px solid #E5A11C',
}

const featureTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
}

const featureText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 4px',
}
