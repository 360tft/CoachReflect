import webpush from 'web-push'

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = 'mailto:support@coachreflect.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    url?: string
    type?: string
  }
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: 'VAPID keys not configured' }
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag,
    data: payload.data,
  })

  try {
    await webpush.sendNotification(pushSubscription, notificationPayload)
    return { success: true }
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number; message?: string }

    // 410 Gone or 404 Not Found means subscription is no longer valid
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      return { success: false, error: 'subscription_expired' }
    }

    console.error('Push notification error:', error)
    return { success: false, error: webPushError.message || 'Unknown error' }
  }
}

// Predefined notification templates for CoachReflect
export const NOTIFICATION_TEMPLATES = {
  streakReminder: (currentStreak: number) => ({
    title: `Don't lose your ${currentStreak}-day streak!`,
    body: 'Take a moment to reflect on today\'s session.',
    tag: 'streak-reminder',
    data: { url: '/dashboard/reflect/new', type: 'streak' },
  }),

  streakLost: () => ({
    title: 'Your reflection streak ended',
    body: 'Start a new streak today - write your first reflection!',
    tag: 'streak-lost',
    data: { url: '/dashboard/reflect/new', type: 'streak' },
  }),

  newBadge: (badgeName: string) => ({
    title: 'New badge earned!',
    body: `Congratulations! You earned the "${badgeName}" badge.`,
    tag: 'badge-earned',
    data: { url: '/dashboard', type: 'badge' },
  }),

  weeklyRecap: (reflectionCount: number) => ({
    title: 'Your weekly reflection recap',
    body: `You wrote ${reflectionCount} reflection${reflectionCount !== 1 ? 's' : ''} this week. Keep growing!`,
    tag: 'weekly-recap',
    data: { url: '/dashboard/history', type: 'recap' },
  }),

  winback: () => ({
    title: 'Time to reflect',
    body: 'Your coaching reflection journal misses you. Write a quick reflection today?',
    tag: 'winback',
    data: { url: '/dashboard/reflect/new', type: 'winback' },
  }),

  reflectionReminder: () => ({
    title: 'How was today\'s session?',
    body: 'Capture your thoughts while they\'re fresh.',
    tag: 'reflection-reminder',
    data: { url: '/dashboard/reflect/new', type: 'reminder' },
  }),

  aiInsightReady: () => ({
    title: 'New AI insight available',
    body: 'Check out what patterns we\'ve found in your reflections.',
    tag: 'ai-insight',
    data: { url: '/dashboard', type: 'insight' },
  }),
}
