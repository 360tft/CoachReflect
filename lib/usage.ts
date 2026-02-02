import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LIMITS } from '@/lib/config'

// Re-export limits for convenience
export const FREE_TIER_LIMITS = {
  DAILY_MESSAGES: LIMITS.FREE.messagesPerDay,
  VOICE_NOTES_PER_MONTH: LIMITS.FREE.voiceNotesPerMonth,
  HISTORY_DAYS: LIMITS.FREE.historyDays,
}

export const PRO_TIER_LIMITS = {
  DAILY_MESSAGES: LIMITS.PRO.messagesPerDay, // -1 = unlimited
  VOICE_NOTES_PER_MONTH: LIMITS.PRO.voiceNotesPerMonth,
  HISTORY_DAYS: LIMITS.PRO.historyDays, // -1 = unlimited
}

export interface UsageData {
  daily_message_count: number
  last_message_date: string
  total_messages: number
  remaining_today: number
  is_limit_reached: boolean
  voice_notes_this_month: number
  voice_notes_remaining: number
}

/**
 * Get usage data for a user
 */
export async function getUserUsage(userId: string): Promise<UsageData> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7) // YYYY-MM

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('daily_message_count, last_message_date, total_messages, voice_notes_this_month, voice_notes_month')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    // No usage record yet - user has full daily limit
    return {
      daily_message_count: 0,
      last_message_date: today,
      total_messages: 0,
      remaining_today: FREE_TIER_LIMITS.DAILY_MESSAGES,
      is_limit_reached: false,
      voice_notes_this_month: 0,
      voice_notes_remaining: FREE_TIER_LIMITS.VOICE_NOTES_PER_MONTH,
    }
  }

  // Check if it's a new day - reset daily count
  const isNewDay = data.last_message_date !== today
  const dailyCount = isNewDay ? 0 : data.daily_message_count
  const remaining = FREE_TIER_LIMITS.DAILY_MESSAGES - dailyCount

  // Check if it's a new month - reset voice notes
  const isNewMonth = data.voice_notes_month !== currentMonth
  const voiceNotesCount = isNewMonth ? 0 : (data.voice_notes_this_month || 0)

  return {
    daily_message_count: dailyCount,
    last_message_date: data.last_message_date,
    total_messages: data.total_messages,
    remaining_today: Math.max(0, remaining),
    is_limit_reached: remaining <= 0,
    voice_notes_this_month: voiceNotesCount,
    voice_notes_remaining: Math.max(0, FREE_TIER_LIMITS.VOICE_NOTES_PER_MONTH - voiceNotesCount),
  }
}

/**
 * Increment message count for a user
 * Returns the updated usage data
 */
export async function incrementMessageCount(userId: string): Promise<UsageData> {
  const adminClient = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // First, get current usage
  const { data: existing } = await adminClient
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // Create new record
    await adminClient
      .from('usage_tracking')
      .insert({
        user_id: userId,
        daily_message_count: 1,
        last_message_date: today,
        total_messages: 1,
        voice_notes_this_month: 0,
        voice_notes_month: today.slice(0, 7),
      })

    return {
      daily_message_count: 1,
      last_message_date: today,
      total_messages: 1,
      remaining_today: FREE_TIER_LIMITS.DAILY_MESSAGES - 1,
      is_limit_reached: false,
      voice_notes_this_month: 0,
      voice_notes_remaining: FREE_TIER_LIMITS.VOICE_NOTES_PER_MONTH,
    }
  }

  // Check if new day
  const isNewDay = existing.last_message_date !== today
  const newDailyCount = isNewDay ? 1 : existing.daily_message_count + 1
  const newTotalCount = existing.total_messages + 1

  // Update record
  await adminClient
    .from('usage_tracking')
    .update({
      daily_message_count: newDailyCount,
      last_message_date: today,
      total_messages: newTotalCount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  const remaining = FREE_TIER_LIMITS.DAILY_MESSAGES - newDailyCount

  return {
    daily_message_count: newDailyCount,
    last_message_date: today,
    total_messages: newTotalCount,
    remaining_today: Math.max(0, remaining),
    is_limit_reached: remaining <= 0,
    voice_notes_this_month: existing.voice_notes_this_month || 0,
    voice_notes_remaining: Math.max(0, FREE_TIER_LIMITS.VOICE_NOTES_PER_MONTH - (existing.voice_notes_this_month || 0)),
  }
}

/**
 * Increment voice note count for a user
 */
export async function incrementVoiceNoteCount(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const adminClient = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)

  const { data: existing } = await adminClient
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // Create new record
    await adminClient
      .from('usage_tracking')
      .insert({
        user_id: userId,
        daily_message_count: 0,
        last_message_date: today,
        total_messages: 0,
        voice_notes_this_month: 1,
        voice_notes_month: currentMonth,
      })

    return {
      allowed: true,
      remaining: FREE_TIER_LIMITS.VOICE_NOTES_PER_MONTH - 1,
    }
  }

  // Check if new month
  const isNewMonth = existing.voice_notes_month !== currentMonth
  const newVoiceCount = isNewMonth ? 1 : (existing.voice_notes_this_month || 0) + 1

  await adminClient
    .from('usage_tracking')
    .update({
      voice_notes_this_month: newVoiceCount,
      voice_notes_month: currentMonth,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return {
    allowed: true,
    remaining: Math.max(0, FREE_TIER_LIMITS.VOICE_NOTES_PER_MONTH - newVoiceCount),
  }
}

/**
 * Check if user can send a message (hasn't exceeded daily limit)
 */
export async function canSendMessage(userId: string, hasSubscription: boolean): Promise<{
  allowed: boolean
  remaining: number
  reason?: string
}> {
  // Pro users have unlimited messages
  if (hasSubscription) {
    return { allowed: true, remaining: -1 } // -1 indicates unlimited
  }

  const usage = await getUserUsage(userId)

  if (usage.is_limit_reached) {
    return {
      allowed: false,
      remaining: 0,
      reason: `You've used all ${FREE_TIER_LIMITS.DAILY_MESSAGES} free messages today. Upgrade to Pro for unlimited access.`,
    }
  }

  return {
    allowed: true,
    remaining: usage.remaining_today,
  }
}

/**
 * Check if user can record a voice note
 * @param durationSeconds - Expected duration in seconds (0 = short by default)
 */
export async function canRecordVoiceNote(userId: string, tier: 'free' | 'pro' | 'pro_plus', durationSeconds: number = 0): Promise<{
  allowed: boolean
  remaining: number
  reason?: string
}> {
  const isShort = durationSeconds < 300
  const isSharedPool = tier === 'pro'

  // Determine the applicable limit
  let limit: number
  if (tier === 'free') {
    limit = 0
  } else if (isSharedPool) {
    // Pro: shared pool of 4
    limit = LIMITS.PRO.shortVoiceNotesPerMonth
  } else if (isShort) {
    // Pro+: unlimited short
    limit = LIMITS.PRO_PLUS.shortVoiceNotesPerMonth
  } else {
    // Pro+: 12 full recordings
    limit = LIMITS.PRO_PLUS.fullRecordingsPerMonth
  }

  // Free tier has 0 voice notes
  if (limit === 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: 'Voice notes are a Pro feature. Upgrade to record your reflections.',
    }
  }

  // Unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1 }
  }

  const usage = await getUserUsage(userId)

  if (usage.voice_notes_this_month >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reason: `You've used all ${limit} voice notes this month. They reset on the 1st.`,
    }
  }

  return {
    allowed: true,
    remaining: limit - usage.voice_notes_this_month,
  }
}
