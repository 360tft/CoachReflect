import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTaskReminderEmail } from '@/lib/email-sender'

export const maxDuration = 30

// POST /api/cron/task-reminders - Daily task reminder emails for Pro/Pro+ users
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  let sent = 0

  try {
    // Get Pro/Pro+ users who have pending tasks
    const { data: usersWithTasks } = await adminClient
      .from('tasks')
      .select('user_id')
      .eq('status', 'pending')

    if (!usersWithTasks || usersWithTasks.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No users with pending tasks' })
    }

    // Get unique user IDs
    const userIds = [...new Set(usersWithTasks.map(t => t.user_id))]

    // Get profiles for these users (Pro/Pro+ only)
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, display_name, subscription_tier')
      .in('user_id', userIds)
      .in('subscription_tier', ['pro', 'pro_plus'])

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No Pro users with pending tasks' })
    }

    // Check they haven't received a task reminder today
    const { data: recentEmails } = await adminClient
      .from('email_log')
      .select('user_id')
      .eq('email_type', 'task-reminder')
      .gte('sent_at', `${today}T00:00:00Z`)

    const alreadySent = new Set((recentEmails || []).map(e => e.user_id))

    for (const profile of profiles) {
      if (alreadySent.has(profile.user_id)) continue

      // Get user email
      const { data: { user } } = await adminClient.auth.admin.getUserById(profile.user_id)
      if (!user?.email) continue

      // Get pending tasks for this user
      const { data: tasks } = await adminClient
        .from('tasks')
        .select('title, priority, due_date')
        .eq('user_id', profile.user_id)
        .eq('status', 'pending')
        .order('priority', { ascending: true })

      if (!tasks || tasks.length === 0) continue

      const highPriorityTasks = tasks
        .filter(t => t.priority === 'high')
        .slice(0, 5)
        .map(t => t.title)

      const overdueTasks = tasks
        .filter(t => t.due_date && t.due_date < today)
        .slice(0, 5)
        .map(t => t.title)

      // Only send if there's something worth emailing about
      if (highPriorityTasks.length === 0 && overdueTasks.length === 0 && tasks.length < 3) {
        continue
      }

      await sendTaskReminderEmail(user.email, {
        name: profile.display_name || 'Coach',
        userId: profile.user_id,
        pendingCount: tasks.length,
        highPriorityTasks,
        overdueTasks,
      })

      sent++
    }

    return NextResponse.json({ sent, message: `Sent ${sent} task reminder emails` })
  } catch (error) {
    console.error('Task reminder cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET handler for Vercel Cron
export async function GET(request: Request) {
  return POST(request)
}
