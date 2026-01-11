// CoachReflect Email Templates
// Simple HTML templates - can be migrated to react-email later

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflect.app'

interface TemplateProps {
  name: string
  unsubscribeUrl?: string
}

function baseTemplate(content: string, props: TemplateProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CoachReflect</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <span style="font-size: 32px;">🪞</span>
    <h1 style="font-size: 24px; color: #92400e; margin: 10px 0;">CoachReflect</h1>
  </div>

  ${content}

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>Part of the 360TFT family of coaching tools</p>
    ${props.unsubscribeUrl ? `<p><a href="${props.unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a></p>` : ''}
  </div>
</body>
</html>
`
}

export const TEMPLATES: Record<string, (props: TemplateProps) => string> = {
  // Onboarding emails
  'welcome': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>Welcome to CoachReflect! You've taken the first step toward becoming a more intentional coach.</p>

    <p>Here's how to get started:</p>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>1. Complete your first reflection</strong><br>
      Just 2 minutes after your next session</p>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>2. Be honest</strong><br>
      This is your private space to grow</p>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>3. Watch the patterns emerge</strong><br>
      Over time, you'll see what makes you effective</p>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/reflect/new" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Start Your First Reflection</a>
    </p>

    <p>Here's to your growth,<br>The CoachReflect Team</p>
  `, props),

  'first-reflection': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>Have you had a session since signing up? If so, take 2 minutes to capture your thoughts.</p>

    <p>The questions are simple:</p>
    <ul>
      <li>What worked well?</li>
      <li>What didn't go as planned?</li>
      <li>Any player standouts?</li>
      <li>What will you focus on next?</li>
    </ul>

    <p>That's it. No pressure to write essays - even a few words per question builds your coaching history.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/reflect/new" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Add a Reflection</a>
    </p>

    <p>Keep growing,<br>The CoachReflect Team</p>
  `, props),

  'reflection-tips': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>Here are 3 reflection questions that coaches tell us make the biggest difference:</p>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 0;"><strong>"What would I do differently?"</strong><br>
      <span style="color: #6b7280;">The honest answer here is gold for next time</span></p>
    </div>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 0;"><strong>"Which player surprised me today?"</strong><br>
      <span style="color: #6b7280;">Track individual development over time</span></p>
    </div>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 0;"><strong>"How did I feel during the session?"</strong><br>
      <span style="color: #6b7280;">Spot burnout before it hits</span></p>
    </div>

    <p>The best reflection is the one you actually do. Keep it simple.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Go to Dashboard</a>
    </p>
  `, props),

  'check-in': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>It's been a week since you joined CoachReflect. How's it going?</p>

    <p>If you've been reflecting regularly - brilliant! You're building a valuable coaching log.</p>

    <p>If you haven't had time yet - no worries. Even one reflection per week compounds over time.</p>

    <p>Quick reminder: The "Coach Chat" feature lets you talk through challenges with an AI coaching partner. It's like having a mentor available 24/7.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/chat" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Try Coach Chat</a>
    </p>

    <p>Questions? Just reply to this email.</p>
  `, props),

  'upgrade-pitch': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>You've been using CoachReflect for a couple of weeks now. Ready to unlock the full potential?</p>

    <p><strong>With Pro ($7.99/month), you get:</strong></p>
    <ul>
      <li>Unlimited reflections</li>
      <li>AI-powered insights that spot patterns across your sessions</li>
      <li>Session plan upload with automatic analysis</li>
      <li>Unlimited coaching conversations</li>
    </ul>

    <p>Most coaches say the AI insights alone are worth it - they notice things you might miss.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/settings" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Upgrade to Pro</a>
    </p>

    <p>Either way, keep reflecting. It's working.</p>
  `, props),

  // Winback emails
  'winback': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>We noticed you haven't logged a reflection in a while. Everything okay?</p>

    <p>If you're between seasons or taking a break - totally get it.</p>

    <p>If you've just been busy - your next session is a perfect time to pick back up. Even a quick reflection helps.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/reflect/new" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Quick Reflection</a>
    </p>

    <p>We're here when you're ready.</p>
  `, props),

  'winback-feature': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>Just wanted to let you know about our newest feature: <strong>Coach Chat</strong>.</p>

    <p>It's like having a coaching mentor available whenever you need to:</p>
    <ul>
      <li>Talk through a tricky player situation</li>
      <li>Process what happened in a tough session</li>
      <li>Get ideas for your next training</li>
      <li>Reflect on your coaching journey</li>
    </ul>

    <p>Give it a try - you've still got free messages available.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/chat" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Try Coach Chat</a>
    </p>
  `, props),

  // Streak emails
  'streak-broken': (props) => baseTemplate(`
    <p>Hey ${props.name},</p>

    <p>Your reflection streak has ended - but that's okay! Every great streak starts with day one.</p>

    <p>Here's the thing: consistency matters more than perfection. Even a brief reflection after your next session gets you back on track.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/reflect/new" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Start a New Streak</a>
    </p>

    <p>You've got this.</p>
  `, props),
}

export function renderTemplate(templateName: string, props: TemplateProps): string | null {
  const template = TEMPLATES[templateName]
  if (!template) return null
  return template(props)
}
