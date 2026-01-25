// Coach Reflection Email Templates
// Simple HTML templates - can be migrated to react-email later

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

interface TemplateProps {
  name: string
  unsubscribeUrl?: string
  // Weekly summary data
  weeklySummary?: {
    reflectionCount: number
    messageCount: number
    voiceNoteCount: number
    sessionPlanCount: number
    topPlayers: Array<{ name: string; count: number; sentiment: 'positive' | 'concern' | 'neutral' }>
    topThemes: Array<{ name: string; count: number }>
    streakDays: number
    keyInsight?: string
    weekStartDate: string
    weekEndDate: string
  }
}

function baseTemplate(content: string, props: TemplateProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coach Reflection</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <span style="font-size: 32px;">🪞</span>
    <h1 style="font-size: 24px; color: #92400e; margin: 10px 0;">Coach Reflection</h1>
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

    <p>Welcome to Coach Reflection! You've taken the first step toward becoming a more intentional coach.</p>

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

    <p>Here's to your growth,<br>The Coach Reflection Team</p>
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

    <p>Keep growing,<br>The Coach Reflection Team</p>
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

    <p>It's been a week since you joined Coach Reflection. How's it going?</p>

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

    <p>You've been using Coach Reflection for a couple of weeks now. Ready to unlock the full potential?</p>

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

  // Streak milestone celebration emails
  'streak-3': (props) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 48px;">3</span>
      <p style="font-size: 18px; color: #d97706; margin: 5px 0;">Day Streak!</p>
    </div>

    <p>Hey ${props.name},</p>

    <p>Three days of reflection - you're building momentum!</p>

    <p>Research shows it takes about 3 weeks to form a habit. You're on your way. Keep going and you'll start seeing patterns in your coaching that you never noticed before.</p>

    <p style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Quick tip:</strong> Set a reminder right after your regular session time. Make reflection part of your routine.
    </p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Keep the Streak Going</a>
    </p>

    <p>Nice work!</p>
  `, props),

  'streak-7': (props) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 48px;">7</span>
      <p style="font-size: 18px; color: #d97706; margin: 5px 0;">Day Streak!</p>
    </div>

    <p>Hey ${props.name},</p>

    <p>A full week of reflecting on your coaching. That's impressive.</p>

    <p>Most coaches never take time to do this. You're already ahead of the curve. By now, you might be noticing:</p>

    <ul>
      <li>Recurring themes in your sessions</li>
      <li>Players who keep showing up in your notes</li>
      <li>Patterns in what works and what doesn't</li>
    </ul>

    <p style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Pro tip:</strong> Check your weekly summary in the Analytics section. See what the AI has spotted that you might have missed.
    </p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/analytics" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Your Analytics</a>
    </p>

    <p>Keep it up!</p>
  `, props),

  'streak-14': (props) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 48px;">14</span>
      <p style="font-size: 18px; color: #d97706; margin: 5px 0;">Day Streak!</p>
    </div>

    <p>Hey ${props.name},</p>

    <p>Two weeks straight. This is no longer a try-out - it's becoming part of who you are as a coach.</p>

    <p>At this point, you've got a proper dataset. Your reflections aren't just notes - they're evidence of your coaching journey. In a year's time, you'll be able to look back and see how far you've come.</p>

    <p style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Think about:</strong> What's the one thing you've learned about yourself as a coach in the last two weeks?
    </p>

    <p>Seriously - we're impressed. Most people don't stick with new habits this long.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Continue Your Journey</a>
    </p>
  `, props),

  'streak-30': (props) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 64px;">30</span>
      <p style="font-size: 24px; color: #d97706; margin: 5px 0;">Day Streak!</p>
    </div>

    <p>Hey ${props.name},</p>

    <p><strong>Thirty days.</strong> A full month of intentional reflection.</p>

    <p>You've officially crossed from "trying something new" to "this is what I do." Reflection is now part of your coaching identity.</p>

    <p>Here's what you've built:</p>
    <ul>
      <li>A searchable log of 30+ sessions</li>
      <li>Patterns the AI has identified across your coaching</li>
      <li>Evidence of your development as a coach</li>
      <li>A habit that separates good coaches from great ones</li>
    </ul>

    <p style="background: #d97706; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <strong>You're in the top 1% of coaches who actually take time to reflect consistently.</strong>
    </p>

    <p>We're genuinely proud to have you as part of Coach Reflection. Keep going - the insights only get richer from here.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard/analytics" style="background: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">See Your 30-Day Journey</a>
    </p>
  `, props),

  // Weekly summary email
  'weekly-summary': (props) => {
    const summary = props.weeklySummary
    if (!summary) {
      return baseTemplate(`
        <p>Hey ${props.name},</p>
        <p>Your weekly summary is being generated. Check back soon!</p>
      `, props)
    }

    const hasActivity = summary.reflectionCount > 0 || summary.messageCount > 0

    const playerSection = summary.topPlayers.length > 0 ? `
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Players Mentioned</strong></p>
        ${summary.topPlayers.slice(0, 3).map(p => {
          const sentimentColor = p.sentiment === 'positive' ? '#16a34a' : p.sentiment === 'concern' ? '#f59e0b' : '#6b7280'
          return `<p style="margin: 5px 0; color: ${sentimentColor};">${p.name}: ${p.count}x</p>`
        }).join('')}
      </div>
    ` : ''

    const themeSection = summary.topThemes.length > 0 ? `
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Top Coaching Themes</strong></p>
        ${summary.topThemes.slice(0, 3).map(t =>
          `<p style="margin: 5px 0;">${t.name}: ${t.count}x</p>`
        ).join('')}
      </div>
    ` : ''

    const insightSection = summary.keyInsight ? `
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #d97706;">
        <p style="margin: 0;"><strong>AI Insight:</strong> ${summary.keyInsight}</p>
      </div>
    ` : ''

    const streakSection = summary.streakDays > 0 ? `
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px;">🔥</span>
        <p style="margin: 5px 0; font-weight: bold;">${summary.streakDays} Day Streak!</p>
      </div>
    ` : ''

    if (!hasActivity) {
      return baseTemplate(`
        <p>Hey ${props.name},</p>

        <p>Here's your weekly coaching summary for ${summary.weekStartDate} - ${summary.weekEndDate}.</p>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0;">No reflections this week - that's okay! Even a quick reflection after your next session helps track your growth.</p>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/chat" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Quick Chat Reflection</a>
        </p>

        <p>See you next week!</p>
      `, props)
    }

    return baseTemplate(`
      <p>Hey ${props.name},</p>

      <p>Here's your weekly coaching summary for ${summary.weekStartDate} - ${summary.weekEndDate}.</p>

      ${streakSection}

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0;">
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="font-size: 24px; margin: 0; font-weight: bold;">${summary.messageCount}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Messages</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="font-size: 24px; margin: 0; font-weight: bold;">${summary.reflectionCount}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Reflections</p>
        </div>
        ${summary.voiceNoteCount > 0 ? `
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="font-size: 24px; margin: 0; font-weight: bold;">${summary.voiceNoteCount}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Voice Notes</p>
        </div>
        ` : ''}
        ${summary.sessionPlanCount > 0 ? `
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="font-size: 24px; margin: 0; font-weight: bold;">${summary.sessionPlanCount}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Session Plans</p>
        </div>
        ` : ''}
      </div>

      ${playerSection}
      ${themeSection}
      ${insightSection}

      <p style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/dashboard/analytics" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Full Analytics</a>
      </p>

      <p>Keep growing!<br>The Coach Reflection Team</p>
    `, props)
  },
}

export function renderTemplate(templateName: string, props: TemplateProps): string | null {
  const template = TEMPLATES[templateName]
  if (!template) return null
  return template(props)
}
