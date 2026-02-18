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
  WinbackFinalEmail,
  StreakBrokenEmail,
} from '@/emails/templates/winback'
import {
  SocialProofEmail,
  FeatureHighlightVoiceEmail,
  LastChanceEmail,
} from '@/emails/templates/engagement'

import { TaskReminderEmail } from '@/emails/templates/task-reminder'

// HTML escape utility to prevent injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Config
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CoachReflection <hello@send.coachreflection.com>'
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
  | 'winback-final'
  | 'streak-broken'
  | 'social-proof'
  | 'feature-highlight'
  | 'last-chance'

interface TemplateConfig {
  component: (props: { name: string; unsubscribeUrl?: string }) => ReactElement
  subject: string
}

const TEMPLATES: Record<TemplateName, TemplateConfig> = {
  'welcome': {
    component: WelcomeEmail,
    subject: 'Welcome to CoachReflection',
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
  'winback-final': {
    component: WinbackFinalEmail,
    subject: 'Quick reminder about CoachReflection',
  },
  'streak-broken': {
    component: StreakBrokenEmail,
    subject: 'Your reflection streak - get back on track',
  },
  'social-proof': {
    component: SocialProofEmail,
    subject: 'What coaches are reflecting on this week',
  },
  'feature-highlight': {
    component: FeatureHighlightVoiceEmail,
    subject: 'AI insights that transform your coaching',
  },
  'last-chance': {
    component: LastChanceEmail,
    subject: 'A thank you from the CoachReflection team',
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
 * Start onboarding email sequence for a new user
 */
export async function startOnboardingSequence(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    const nextSendDate = new Date(now)
    nextSendDate.setDate(nextSendDate.getDate() + 1)

    await supabase.from('email_sequences').insert({
      user_id: userId,
      sequence_name: 'onboarding',
      current_step: 1,
      started_at: now.toISOString(),
      next_send_at: nextSendDate.toISOString(),
      completed: false,
      paused: false,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to start onboarding sequence:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Notify admin of new free signup (SAAS-STANDARD alias)
 */
export async function notifyNewFreeSignup(userEmail: string): Promise<void> {
  return notifyNewSignup(userEmail)
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
      subject: 'New CoachReflection Signup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E5A11C;">New User Signed Up</h2>
          <p>A new user has signed up for CoachReflection:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
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
      subject: 'New Pro Subscription - CoachReflection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E5A11C;">New Pro Subscriber!</h2>
          <p>A user has upgraded to Pro:</p>
          <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #E5A11C;">
            <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
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

/**
 * Notify admin of subscription cancellation
 */
export async function notifySubscriptionCanceled(
  userEmail: string
): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'Subscription Canceled - CoachReflection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Subscription Canceled</h2>
          <p>A user has canceled their Pro subscription:</p>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #dc2626;">
            <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Consider sending a winback email or checking in with this user.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send cancellation notification:', error)
  }
}

/**
 * SAAS-STANDARD alias for notifySubscriptionCanceled
 */
export async function notifySubscriptionCancelled(userEmail: string): Promise<void> {
  return notifySubscriptionCanceled(userEmail)
}

/**
 * Send pro welcome email to customer after subscription
 */
export async function sendProWelcomeEmail(userEmail: string): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { success: false, error: 'Email not configured' }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Welcome to CoachReflection Pro!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E5A11C;">Welcome to Pro!</h2>
          <p>Thank you for upgrading to CoachReflection Pro. You now have access to:</p>
          <ul>
            <li>Unlimited reflections</li>
            <li>AI-powered coaching insights</li>
            <li>Advanced pattern detection</li>
            <li>Session plan analysis</li>
          </ul>
          <p>Start your next reflection now:</p>
          <p><a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #E5A11C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Dashboard</a></p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send Pro welcome email:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Notify admin of new Pro trial started
 */
export async function notifyTrialStarted(userEmail: string): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'New Pro Trial Started - CoachReflection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E5A11C;">New Pro Trial Started</h2>
          <p>A user has started a 7-day Pro trial:</p>
          <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #E5A11C;">
            <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
            <p style="margin: 8px 0 0 0;"><strong>Trial ends:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Card on file. They'll be charged automatically on day 8 unless they cancel.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send trial started notification:', error)
  }
}

/**
 * Notify admin of trial conversion (trialing → active)
 */
export async function notifyTrialConverted(userEmail: string): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'Trial Converted to Pro! - CoachReflection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Trial Converted to Pro!</h2>
          <p>A trial user has converted to a paying Pro subscriber:</p>
          <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #16a34a;">
            <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            <a href="https://dashboard.stripe.com/customers" style="color: #E5A11C;">View in Stripe</a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send trial converted notification:', error)
  }
}

/**
 * Notify admin of trial cancellation
 */
export async function notifyTrialCancelled(userEmail: string): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'Trial Cancelled - CoachReflection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Trial Cancelled</h2>
          <p>A user cancelled during their 7-day Pro trial:</p>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #dc2626;">
            <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            They were never charged. Consider checking in to find out why.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send trial cancelled notification:', error)
  }
}

/**
 * Send trial converted email (trialing → active)
 */
export async function sendTrialConvertedEmail(userEmail: string): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { success: false, error: 'Email not configured' }

  try {
    const { renderTemplate } = await import('@/lib/email-templates')
    const html = renderTemplate('trial-converted', {
      name: userEmail.split('@')[0] || 'Coach',
    })

    if (!html) return { success: false, error: 'Template not found' }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Thanks for staying with Pro',
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send trial converted email:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send trial cancelled email (trialing → cancelled)
 */
export async function sendTrialCancelledEmail(userEmail: string): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { success: false, error: 'Email not configured' }

  try {
    const { renderTemplate } = await import('@/lib/email-templates')
    const html = renderTemplate('trial-cancelled', {
      name: userEmail.split('@')[0] || 'Coach',
    })

    if (!html) return { success: false, error: 'Template not found' }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Your Pro trial has ended',
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send trial cancelled email:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send abandoned checkout recovery email
 */
export async function sendAbandonedCheckoutEmail(
  userEmail: string,
  recoveryUrl: string
): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) return { success: false, error: 'Email not configured' }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Complete your CoachReflection Pro upgrade',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; color: #92400e; margin: 10px 0;">CoachReflection</h1>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hey there,</p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Looks like you started upgrading to Pro but didn't finish. No worries, these things happen.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Just in case you still want it, here's what Pro gives you:
          </p>

          <ul style="font-size: 16px; line-height: 1.8; color: #374151;">
            <li>Unlimited reflections</li>
            <li>AI-powered coaching insights</li>
            <li>Voice notes for hands-free reflection</li>
            <li>Session plan analysis</li>
            <li>Advanced pattern detection</li>
          </ul>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${recoveryUrl}" style="background: #E5A11C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">Complete Your Upgrade</a>
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            If you changed your mind, that's completely fine. The free version is yours to keep.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Kev</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <div style="text-align: center; color: #6b7280; font-size: 12px;">
            <p>Part of the 360TFT family of coaching tools</p>
          </div>
        </div>
      `,
    })

    // Log to email_log if we can find the user
    const supabase = createAdminClient()
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === userEmail)
    if (user) {
      await logEmailSent(user.id, 'checkout-recovery', 'Complete your CoachReflection Pro upgrade')
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send abandoned checkout email:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Notify admin of negative feedback
 */
export async function notifyNegativeFeedback(
  userEmail: string | undefined,
  contentText: string,
  responseText: string,
  feedbackText?: string,
  contentType?: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) return { success: false, error: 'Email not configured' }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'Negative Feedback - CoachReflection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Negative Feedback Received</h2>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #dc2626;">
            <p style="margin: 0;"><strong>User:</strong> ${escapeHtml(userEmail || 'Unknown')}</p>
            ${contentType ? `<p style="margin: 8px 0 0 0;"><strong>Content Type:</strong> ${escapeHtml(contentType)}</p>` : ''}
            ${feedbackText ? `<p style="margin: 8px 0 0 0;"><strong>Feedback:</strong> ${escapeHtml(feedbackText)}</p>` : ''}
            <p style="margin: 8px 0 0 0;"><strong>Content:</strong> ${escapeHtml(contentText.slice(0, 200))}${contentText.length > 200 ? '...' : ''}</p>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send negative feedback notification:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send task reminder email (Pro/Pro+ only)
 */
export async function sendTaskReminderEmail(
  to: string,
  props: {
    name: string
    userId: string
    pendingCount: number
    highPriorityTasks: string[]
    overdueTasks: string[]
  }
): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    return { success: false, error: 'Email not configured' }
  }

  const unsubscribeUrl = `${APP_URL}/unsubscribe?userId=${props.userId}`

  try {
    const element = createElement(TaskReminderEmail, {
      name: props.name,
      pendingCount: props.pendingCount,
      highPriorityTasks: props.highPriorityTasks,
      overdueTasks: props.overdueTasks,
      unsubscribeUrl,
    })
    const html = await render(element)

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You have ${props.pendingCount} pending coaching task${props.pendingCount !== 1 ? 's' : ''}`,
      html,
    })

    await logEmailSent(props.userId, 'task-reminder', 'Task reminder')

    return { success: true }
  } catch (error) {
    console.error('Failed to send task reminder email:', error)
    return { success: false, error: String(error) }
  }
}
