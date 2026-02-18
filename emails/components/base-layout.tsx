import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
  unsubscribeUrl?: string
}

export function BaseLayout({ preview, children, unsubscribeUrl }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoEmoji}>CR</Text>
            <Text style={logoText}>CoachReflection</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>Part of the 360TFT family of coaching tools</Text>
            {unsubscribeUrl && (
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const logoEmoji = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#E5A11C',
  margin: '0',
}

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '10px 0 0 0',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
}

const footerLink = {
  color: '#6b7280',
  fontSize: '12px',
  textDecoration: 'underline',
}
