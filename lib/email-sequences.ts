// Coach Reflection Email Sequence Configuration

export type SequenceName = 'onboarding' | 'winback' | 'streak_recovery' | 'weekly_summary'

// Streak milestones that trigger celebration emails
export const STREAK_MILESTONES = [3, 7, 14, 30] as const
export type StreakMilestone = (typeof STREAK_MILESTONES)[number]

export interface SequenceStep {
  day: number        // Days since sequence started
  template: string   // Template name
  subject: string    // Email subject line
}

// Onboarding sequence for new users (7 steps - SAAS-STANDARD compliant)
export const ONBOARDING_SEQUENCE: SequenceStep[] = [
  { day: 0, template: 'welcome', subject: 'Welcome to Coach Reflection' },
  { day: 1, template: 'first-reflection', subject: 'Your first reflection takes 2 minutes' },
  { day: 3, template: 'social-proof', subject: 'What coaches are reflecting on this week' },
  { day: 5, template: 'feature-highlight', subject: 'AI insights that transform your coaching' },
  { day: 7, template: 'check-in', subject: 'How are your reflections going?' },
  { day: 10, template: 'upgrade-pitch', subject: 'Ready for AI-powered insights?' },
  { day: 21, template: 'last-chance', subject: 'A thank you from the Coach Reflection team' },
]

// Win-back sequence for inactive users (7+ days no activity)
export const WINBACK_SEQUENCE: SequenceStep[] = [
  { day: 0, template: 'winback', subject: 'Miss your reflections? We do too' },
  { day: 3, template: 'winback-feature', subject: "New: Chat with your coaching AI" },
  { day: 7, template: 'winback-final', subject: 'Quick reminder about Coach Reflection' },
]

// Streak recovery for users who broke their streak
export const STREAK_RECOVERY_SEQUENCE: SequenceStep[] = [
  { day: 0, template: 'streak-broken', subject: 'Your reflection streak - get back on track' },
]

// Weekly summary (recurring, not a sequence - just a single template)
export const WEEKLY_SUMMARY_SEQUENCE: SequenceStep[] = [
  { day: 0, template: 'weekly-summary', subject: 'Your Week in Coaching' },
]

// Get sequence by name
export function getSequence(name: SequenceName): SequenceStep[] {
  switch (name) {
    case 'onboarding':
      return ONBOARDING_SEQUENCE
    case 'winback':
      return WINBACK_SEQUENCE
    case 'streak_recovery':
      return STREAK_RECOVERY_SEQUENCE
    case 'weekly_summary':
      return WEEKLY_SUMMARY_SEQUENCE
    default:
      return []
  }
}

// Calculate next send time based on sequence step
export function getNextSendTime(
  sequence: SequenceStep[],
  currentStep: number,
  sequenceStartDate: Date
): Date | null {
  const nextStep = sequence[currentStep + 1]
  if (!nextStep) return null

  const nextSendTime = new Date(sequenceStartDate)
  nextSendTime.setDate(nextSendTime.getDate() + nextStep.day)
  return nextSendTime
}

// Check if streak count is a milestone
export function isStreakMilestone(streak: number): streak is StreakMilestone {
  return STREAK_MILESTONES.includes(streak as StreakMilestone)
}

// Get streak milestone email template and subject
export function getStreakMilestoneEmail(streak: StreakMilestone): { template: string; subject: string } {
  switch (streak) {
    case 3:
      return { template: 'streak-3', subject: '3-day reflection streak!' }
    case 7:
      return { template: 'streak-7', subject: 'One week of reflections!' }
    case 14:
      return { template: 'streak-14', subject: 'Two weeks strong!' }
    case 30:
      return { template: 'streak-30', subject: '30-day reflection streak!' }
  }
}
