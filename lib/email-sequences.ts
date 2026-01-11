// CoachReflect Email Sequence Configuration

export type SequenceName = 'onboarding' | 'winback' | 'streak_recovery'

export interface SequenceStep {
  day: number        // Days since sequence started
  template: string   // Template name
  subject: string    // Email subject line
}

// Onboarding sequence for new users
export const ONBOARDING_SEQUENCE: SequenceStep[] = [
  { day: 0, template: 'welcome', subject: 'Welcome to CoachReflect' },
  { day: 1, template: 'first-reflection', subject: 'Your first reflection takes 2 minutes' },
  { day: 3, template: 'reflection-tips', subject: '3 questions that unlock coaching growth' },
  { day: 7, template: 'check-in', subject: 'How are your reflections going?' },
  { day: 14, template: 'upgrade-pitch', subject: 'Ready for AI-powered insights?' },
]

// Win-back sequence for inactive users (7+ days no activity)
export const WINBACK_SEQUENCE: SequenceStep[] = [
  { day: 0, template: 'winback', subject: 'Miss your reflections? We do too' },
  { day: 3, template: 'winback-feature', subject: "New: Chat with your coaching AI" },
]

// Streak recovery for users who broke their streak
export const STREAK_RECOVERY_SEQUENCE: SequenceStep[] = [
  { day: 0, template: 'streak-broken', subject: 'Your reflection streak - get back on track' },
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
