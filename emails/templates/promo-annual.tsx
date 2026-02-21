import {
  Button,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from '../components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

interface PromoAnnualEmailProps {
  name: string
  unsubscribeUrl?: string
}

export function PromoAnnualEmail({ name, unsubscribeUrl }: PromoAnnualEmailProps) {
  return (
    <BaseLayout
      preview="Half price Pro for your first year"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Whether you've reflected 50 times or haven't started yet, this applies
        to you.
      </Text>

      <Text style={paragraph}>
        Annual Pro is 50% off for your first year.
      </Text>

      {/* Pro offer */}
      <Section style={offerBox}>
        <Text style={offerTitle}>Pro</Text>
        <Text style={offerOriginalPrice}>
          <s>$76.99/year</s>
        </Text>
        <Text style={offerPromoPrice}>$38.50 for your first year</Text>
        <Text style={offerMonthly}>That's $3.21/mo</Text>
        <Text style={offerFeatures}>
          Unlimited reflections, 4 voice notes/month, AI memory across sessions,
          session plan feedback, CPD evidence.
        </Text>
      </Section>

      {/* Pro+ offer */}
      <Section style={offerBox}>
        <Text style={offerTitle}>Pro+</Text>
        <Text style={offerOriginalPrice}>
          <s>$199/year</s>
        </Text>
        <Text style={offerPromoPrice}>$99.50 for your first year</Text>
        <Text style={offerMonthly}>That's $8.29/mo</Text>
        <Text style={offerFeatures}>
          Everything in Pro, plus unlimited voice notes, full session recordings
          analysed, development blocks, and syllabus upload.
        </Text>
      </Section>

      <Text style={paragraph}>
        Both include a 7-day free trial. If it doesn't change how you reflect in
        that first week, cancel and pay nothing.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/pricing?utm_source=promo-annual-50`} style={button}>
          Start Your Free Trial
        </Button>
      </Section>

      <Text style={deadline}>
        Offer ends 7 March. Full price from year 2.
      </Text>

      <Text style={signature}>Kevin</Text>
      <Text style={signatureSub}>CoachReflection</Text>
    </BaseLayout>
  )
}

// Styles
const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '16px 0',
}

const signature = {
  fontSize: '16px',
  lineHeight: '1.2',
  color: '#374151',
  margin: '24px 0 0',
  fontWeight: '500' as const,
}

const signatureSub = {
  fontSize: '14px',
  lineHeight: '1.2',
  color: '#6b7280',
  margin: '4px 0 0',
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
  padding: '14px 28px',
}

const deadline = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#dc2626',
  fontWeight: '600' as const,
  margin: '16px 0',
  textAlign: 'center' as const,
}

const offerBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '16px 0',
  border: '2px solid #f59e0b',
}

const offerTitle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: '700' as const,
  margin: '0 0 4px',
}

const offerOriginalPrice = {
  color: '#9ca3af',
  fontSize: '15px',
  margin: '0 0 4px',
}

const offerPromoPrice = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '700' as const,
  margin: '0 0 4px',
}

const offerMonthly = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 8px',
}

const offerFeatures = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}
