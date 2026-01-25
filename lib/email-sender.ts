// Email Sender - Uses React Email templates with Resend
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { createElement, type ReactElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

// Import React Email templates
import {
  WelcomeEmail,
  FirstReflectionEmail,
  ReflectionTipsEmail,
  CheckInEmail,
  UpgradePitchEmail,
} from '@/emails/templates/onboarding'
import {
  Streak3Email,
  Streak7Email,
  Streak14Email,
  Streak30Email,
} from '@/emails/templates/streak'
import {
  WinbackEmail,
  WinbackFeatureEmail,
  StreakBrokenEmail,
} from '@/emails/templates/winback'

// Config
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Coach Reflection <hello@coachreflection.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(',')[0] || 'admin@360tft.com'

// Lazy-load Resend client
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

interface EmailResult {
  success: boolean
  error?: string
}

// Template mapping
type TemplateName =
  | 'welcome'
  | 'first-reflection'
  | 'reflection-tips'
  | 'check-in'
  | 'upgrade-pitch'
  | 'streak-3'
  | 'streak-7'
  | 'streak-14'
  | 'streak-30'
  | 'winback'
  | 'winback-feature'
  | 'streak-broken'

interface TemplateConfig {
  component: (props: { name: string; unsubscribeUrl?: string }) => ReactElement
  subject: string
}

const TEMPLATES: Record<TemplateName, TemplateConfig> = {
  'welcome': {
    component: WelcomeEmail,
    subject: 'Welcome to Coach Reflection',
  },
  'first-reflection': {
    component: FirstReflectionEmail,
    subject: 'Your first reflection takes 2 minutes',
  },
  'reflection-tips': {
    component: ReflectionTipsEmail,
    subject: '3 questions that unlock coaching growth',
  },
  'check-in': {
    component: CheckInEmail,
    subject: 'How are your reflections going?',
  },
  'upgrade-pitch': {
    component: UpgradePitchEmail,
    subject: 'Ready for AI-powered insights?',
  },
  'streak-3': {
    component: Streak3Email,
    subject: '3-day reflection streak!',
  },
  'streak-7': {
    component: Streak7Email,
    subject: 'One week of reflections!',
  },
  'streak-14': {
    component: Streak14Email,
    subject: 'Two weeks strong!',
  },
  'streak-30': {
    component: Streak30Email,
    subject: '30-day reflection streak!',
  },
  'winback': {
    component: WinbackEmail,
    subject: 'Miss your reflections? We do too',
  },
  'winback-feature': {
    component: WinbackFeatureEmail,
    subject: 'New: Chat with your coaching AI',
  },
  'streak-broken': {
    component: StreakBrokenEmail,
    subject: 'Your reflection streak - get back on track',
  },
}

/**
 * Send an email using a React Email template
 */
export async function sendTemplateEmail(
  to: string,
  templateName: TemplateName,
  props: { name: string; userId?: string }
): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.log('RESEND_API_KEY not set, skipping email')
    return { success: false, error: 'Email not configured' }
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    return { success: false, error: `Unknown template: ${templateName}` }
  }

  const unsubscribeUrl = props.userId
    ? `${APP_URL}/unsubscribe?userId=${props.userId}`
    : undefined

  try {
    // Render the React Email component to HTML
    const element = createElement(template.component, {
      name: props.name,
      unsubscribeUrl,
    })
    const html = await render(element)

    // Send email
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html,
    })

    // Log to database
    if (props.userId) {
      await logEmailSent(props.userId, templateName, template.subject)
    }

    return { success: true }
  } catch (error) {
    console.error(`Failed to send ${templateName} email:`, error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send streak milestone email
 */
export async function sendStreakMilestoneEmail(
  to: string,
  streak: 3 | 7 | 14 | 30,
  props: { name: string; userId?: string }
): Promise<EmailResult> {
  const templateName = `streak-${streak}` as TemplateName
  return sendTemplateEmail(to, templateName, props)
}

/**
 * Log sent email to database
 */
async function logEmailSent(
  userId: string,
  emailType: string,
  subject: string
): Promise<void> {
  const supabase = createAdminClient()

  await supabase.from('email_log').insert({
    user_id: userId,
    email_type: emailType,
    subject,
    sent_at: new Date().toISOString(),
  })
}

/**
 * Notify admin of new signup
 */
export async function notifyNewSignup(userEmail: string): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'New Coach Reflection Signup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E5A11C;">New User Signed Up</h2>
          <p>A new user has signed up for Coach Reflection:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${userEmail}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            <a href="${APP_URL}/app/admin" style="color: #E5A11C;">View admin dashboard</a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send signup notification:', error)
  }
}

/**
 * Notify admin of new Pro subscription
 */
export async function notifyNewProSubscription(
  userEmail: string,
  amount?: number
): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'New Pro Subscription - Coach Reflection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E5A11C;">New Pro Subscriber!</h2>
          <p>A user has upgraded to Pro:</p>
          <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #E5A11C;">
            <p style="margin: 0;"><strong>Email:</strong> ${userEmail}</p>
            ${amount ? `<p style="margin: 8px 0 0 0;"><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>` : ''}
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            <a href="https://dashboard.stripe.com/customers" style="color: #E5A11C;">View in Stripe</a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send Pro signup notification:', error)
  }
}
