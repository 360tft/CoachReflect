// Gamification system for Coach Reflection
// Handles streaks, badges, and coaching theme tracking

import { createAdminClient } from '@/lib/supabase/admin'

export interface StreakData {
  current_streak: number
  longest_streak: number
  last_activity_date: string
  total_active_days: number
}

export interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  category: 'streak' | 'milestone' | 'topic' | 'special'
  requirement_value: number
}

export interface UserBadge {
  badge_id: string
  earned_at: string | null
  badge: Badge
}

export interface ThemeProgress {
  theme: string
  mention_count: number
}

// Coaching theme detection keywords
const THEME_KEYWORDS: Record<string, string[]> = {
  discipline: ['discipline', 'behavior', 'listening', 'focus', 'distracted', 'messing around', 'attention'],
  communication: ['communication', 'talking', 'quiet', 'shout', 'vocal', 'leadership', 'voice'],
  attitude: ['attitude', 'body language', 'sulking', 'positive', 'negative', 'moody'],
  motivation: ['motivation', 'motivated', 'lazy', 'effort', 'trying', 'energy', 'enthusiasm'],
  confidence: ['confidence', 'confident', 'shy', 'scared', 'afraid', 'nervous', 'brave'],
  resilience: ['resilience', 'bounce back', 'mistake', 'head down', 'giving up', 'perseverance'],
  technique: ['technique', 'skill', 'touch', 'passing', 'shooting', 'dribbling', 'first touch'],
  positioning: ['positioning', 'position', 'space', 'movement', 'shape', 'structure'],
  decision_making: ['decision', 'choice', 'option', 'timing', 'when to pass', 'when to shoot'],
  fitness: ['fitness', 'stamina', 'tired', 'running', 'pace', 'speed', 'endurance'],
  teamwork: ['teamwork', 'team', 'together', 'selfish', 'unit', 'collective'],
  parents: ['parent', 'parents', 'sideline', 'shouting', 'interfering', 'pressure', 'dad', 'mum'],
}

/**
 * Detect coaching themes from reflection text
 */
export function detectThemes(text: string): string[] {
  const lowerText = text.toLowerCase()
  const detectedThemes: string[] = []

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        detectedThemes.push(theme)
        break
      }
    }
  }

  return detectedThemes
}

/**
 * Update user's streak
 * Call this when a user creates a reflection
 */
export async function updateStreak(userId: string): Promise<{
  streak: number
  isNewDay: boolean
  newBadges: string[]
  isStreakMilestone: boolean
}> {
  const adminClient = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const newBadges: string[] = []

  // Get current streak
  const { data: existing } = await adminClient
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // Create new streak record
    await adminClient
      .from('streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        total_active_days: 1,
      })

    return { streak: 1, isNewDay: true, newBadges, isStreakMilestone: false }
  }

  // Already active today
  if (existing.last_activity_date === today) {
    return { streak: existing.current_streak, isNewDay: false, newBadges, isStreakMilestone: false }
  }

  // Calculate days difference
  const lastDate = new Date(existing.last_activity_date)
  const todayDate = new Date(today)
  const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  let newStreak: number
  if (daysDiff === 1) {
    // Streak continues
    newStreak = existing.current_streak + 1
  } else {
    // Streak broken (more than 1 day gap)
    newStreak = 1
  }

  const longestStreak = Math.max(newStreak, existing.longest_streak)
  const totalActiveDays = existing.total_active_days + 1

  // Update streak
  await adminClient
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      total_active_days: totalActiveDays,
    })
    .eq('user_id', userId)

  // Check for streak badges
  const streakMilestones = [3, 7, 14, 30, 100]
  const isStreakMilestone = streakMilestones.includes(newStreak)

  for (const milestone of streakMilestones) {
    if (newStreak >= milestone) {
      const badgeId = `streak_${milestone}`
      const badge = await checkAndAwardBadge(userId, badgeId)
      if (badge) newBadges.push(badge)
    }
  }

  return { streak: newStreak, isNewDay: true, newBadges, isStreakMilestone }
}

/**
 * Update reflection count and check for milestone badges
 */
export async function updateReflectionMilestones(userId: string): Promise<string[]> {
  const adminClient = createAdminClient()
  const newBadges: string[] = []

  // Get total reflections
  const { count } = await adminClient
    .from('reflections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const totalReflections = count || 0

  // Update profile
  await adminClient
    .from('profiles')
    .update({ total_reflections: totalReflections })
    .eq('user_id', userId)

  // Check milestone badges
  const milestones = [
    { count: 1, id: 'reflections_1' },
    { count: 10, id: 'reflections_10' },
    { count: 50, id: 'reflections_50' },
    { count: 100, id: 'reflections_100' },
    { count: 500, id: 'reflections_500' },
  ]

  for (const milestone of milestones) {
    if (totalReflections >= milestone.count) {
      const badge = await checkAndAwardBadge(userId, milestone.id)
      if (badge) newBadges.push(badge)
    }
  }

  return newBadges
}

/**
 * Check if user should receive a badge and award it
 */
async function checkAndAwardBadge(userId: string, badgeId: string): Promise<string | null> {
  const adminClient = createAdminClient()

  // Check if already earned
  const { data: existing } = await adminClient
    .from('user_badges')
    .select('earned_at')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single()

  if (existing?.earned_at) {
    // Already earned
    return null
  }

  // Award the badge
  if (existing) {
    // Update existing record
    await adminClient
      .from('user_badges')
      .update({ earned_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
  } else {
    // Insert new record
    await adminClient
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString(),
      })
  }

  return badgeId
}

/**
 * Get user's streak data
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('streaks')
    .select('current_streak, longest_streak, last_activity_date, total_active_days')
    .eq('user_id', userId)
    .single()

  if (!data) {
    return {
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: new Date().toISOString().split('T')[0],
      total_active_days: 0,
    }
  }

  // Check if streak is still active (last activity was yesterday or today)
  const lastDate = new Date(data.last_activity_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastDate.setHours(0, 0, 0, 0)

  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  // If more than 1 day has passed, streak is broken
  if (daysDiff > 1) {
    return {
      current_streak: 0,
      longest_streak: data.longest_streak,
      last_activity_date: data.last_activity_date,
      total_active_days: data.total_active_days,
    }
  }

  return data
}

/**
 * Get all badges with user's earned status
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const adminClient = createAdminClient()

  // Get all badges
  const { data: badges } = await adminClient
    .from('badges')
    .select('*')
    .order('category')
    .order('requirement_value')

  if (!badges) return []

  // Get user's earned badges
  const { data: userBadges } = await adminClient
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId)

  const userBadgeMap = new Map(
    (userBadges || []).map(ub => [ub.badge_id, ub])
  )

  return badges.map(badge => ({
    badge_id: badge.id,
    earned_at: userBadgeMap.get(badge.id)?.earned_at || null,
    badge: {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      emoji: badge.emoji,
      category: badge.category,
      requirement_value: badge.requirement_value,
    },
  }))
}

/**
 * Check if streak is at a milestone that warrants a celebration email
 */
export function isStreakMilestone(streak: number): boolean {
  return [3, 7, 14, 30].includes(streak)
}

/**
 * Update task completion milestones and check for badges
 */
export async function updateTaskMilestones(userId: string): Promise<string[]> {
  const adminClient = createAdminClient()
  const newBadges: string[] = []

  // Get total completed tasks
  const { count } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')

  const totalCompleted = count || 0

  const milestones = [
    { count: 1, id: 'tasks_1' },
    { count: 5, id: 'tasks_5' },
    { count: 10, id: 'tasks_10' },
    { count: 25, id: 'tasks_25' },
    { count: 50, id: 'tasks_50' },
  ]

  for (const milestone of milestones) {
    if (totalCompleted >= milestone.count) {
      const badge = await checkAndAwardBadge(userId, milestone.id)
      if (badge) newBadges.push(badge)
    }
  }

  return newBadges
}

/**
 * Award special badges (e.g., early adopter, first session plan)
 */
export async function awardSpecialBadge(userId: string, badgeId: string): Promise<boolean> {
  const badge = await checkAndAwardBadge(userId, badgeId)
  return badge !== null
}
