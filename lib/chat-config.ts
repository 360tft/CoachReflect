// Coach Reflection Chat Configuration

export const CHAT_CONFIG = {
  maxTokens: 2048,
  temperature: 0.7,
  maxHistoryMessages: 20, // Keep last N messages for context
  maxMessageLength: 5000,
}

// Sport display names for prompts
export const SPORT_NAMES: Record<string, string> = {
  football: 'football (soccer)',
  rugby: 'rugby',
  basketball: 'basketball',
  hockey: 'hockey',
  tennis: 'tennis',
  cricket: 'cricket',
  volleyball: 'volleyball',
  baseball: 'baseball',
  american_football: 'American football',
  swimming: 'swimming',
  athletics: 'athletics/track & field',
  gymnastics: 'gymnastics',
  martial_arts: 'martial arts',
  other: 'sports',
}

// Get sport-specific terminology
export function getSportTerminology(sport: string): {
  session: string
  player: string
  team: string
  match: string
  drill: string
} {
  const terminology: Record<string, { session: string; player: string; team: string; match: string; drill: string }> = {
    football: { session: 'training session', player: 'player', team: 'team', match: 'match', drill: 'drill' },
    rugby: { session: 'training session', player: 'player', team: 'team', match: 'match', drill: 'drill' },
    basketball: { session: 'practice', player: 'player', team: 'team', match: 'game', drill: 'drill' },
    hockey: { session: 'training session', player: 'player', team: 'team', match: 'match', drill: 'drill' },
    tennis: { session: 'practice session', player: 'player', team: 'doubles pair', match: 'match', drill: 'drill' },
    cricket: { session: 'nets session', player: 'player', team: 'team', match: 'match', drill: 'drill' },
    volleyball: { session: 'practice', player: 'player', team: 'team', match: 'match', drill: 'drill' },
    baseball: { session: 'practice', player: 'player', team: 'team', match: 'game', drill: 'drill' },
    american_football: { session: 'practice', player: 'player', team: 'team', match: 'game', drill: 'drill' },
    swimming: { session: 'training session', player: 'swimmer', team: 'squad', match: 'meet', drill: 'set' },
    athletics: { session: 'training session', player: 'athlete', team: 'squad', match: 'competition', drill: 'exercise' },
    gymnastics: { session: 'training session', player: 'gymnast', team: 'squad', match: 'competition', drill: 'routine' },
    martial_arts: { session: 'training session', player: 'student', team: 'class', match: 'bout', drill: 'technique' },
    other: { session: 'training session', player: 'athlete', team: 'team', match: 'competition', drill: 'drill' },
  }
  return terminology[sport] || terminology.other
}

// Generate system prompt based on sport
export function getSystemPrompt(sport: string = 'football'): string {
  const sportName = SPORT_NAMES[sport] || sport
  const terms = getSportTerminology(sport)

  return `You are a supportive coaching reflection partner for ${sportName} coaches. Your role is to help coaches reflect on their sessions, identify patterns, work through challenges, and grow as coaches.

## Your Personality
- Warm, supportive, and non-judgmental
- Ask thoughtful questions to deepen reflection
- Celebrate wins and progress, no matter how small
- Acknowledge the emotional side of coaching
- Practical and action-oriented when appropriate

## Your Expertise
You have deep knowledge of:
- ${sportName.charAt(0).toUpperCase() + sportName.slice(1)} coaching at all levels (grassroots to professional)
- ${terms.player.charAt(0).toUpperCase() + terms.player.slice(1)} development and psychology
- ${terms.session.charAt(0).toUpperCase() + terms.session.slice(1)} planning and periodization
- Communication and feedback techniques
- Managing parents, clubs, and expectations
- Coach self-care and avoiding burnout

## How You Help
1. **Post-Session Reflection**: Guide coaches through what went well, what didn't, and why
2. **Pattern Recognition**: Help identify recurring themes across sessions
3. **Challenge Navigation**: Provide thoughtful perspective on difficult situations
4. **Goal Setting**: Help coaches define and track their development goals
5. **Emotional Processing**: Create space for coaches to process frustrations and celebrate victories

## Communication Style
- Use "I" statements: "I think...", "I've found...", "In my experience..."
- Never preach or lecture - you're a thinking partner, not an authority
- Ask clarifying questions before giving advice
- Match the coach's energy - if they're venting, listen first
- Use ${sportName}-specific terminology appropriately
- Be concise but thorough - coaches are busy

## Important Boundaries
- You are NOT a licensed therapist or mental health professional
- For serious mental health concerns, recommend professional support
- Don't make medical or legal recommendations
- Focus on coaching practice, not ${terms.player} medical issues

## Response Format
- Keep responses focused and actionable
- Use bullet points for lists
- Bold key takeaways
- Suggest 1-2 follow-up questions when appropriate
- End with an actionable next step when the coach is ready

Remember: Your goal is to help coaches become more self-aware and intentional in their practice. Every conversation should leave the coach feeling heard, supported, and clearer about their next steps.`
}

// Legacy export for backwards compatibility
export const SYSTEM_PROMPT = getSystemPrompt('football')

// Generate follow-up suggestions based on conversation
export function generateFollowUps(lastMessage: string, topic: string): string[] {
  // Basic follow-up suggestions - in production, these could be AI-generated
  const followUps: Record<string, string[]> = {
    reflection: [
      "What specifically made that work well?",
      "How did the players respond?",
      "What would you do differently next time?",
    ],
    challenge: [
      "How long has this been happening?",
      "What have you tried so far?",
      "How does this affect the rest of the team?",
    ],
    development: [
      "What's your timeline for this goal?",
      "Who could support you in this?",
      "What's the first small step you could take?",
    ],
    default: [
      "Tell me more about that",
      "How did that make you feel?",
      "What do you think is the root cause?",
    ],
  }

  return followUps[topic] || followUps.default
}

// Build context from user's profile and memory
export function buildUserContext(
  profile: {
    display_name?: string | null
    club_name?: string | null
    age_group?: string | null
    coaching_level?: string | null
    sport?: string | null
  },
  memory?: {
    coaching_style?: string[] | null
    common_challenges?: string[] | null
    strengths?: string[] | null
    goals?: string[] | null
    team_context?: string | null
  }
): string {
  const parts: string[] = []
  const sport = profile.sport || 'football'
  const terms = getSportTerminology(sport)

  if (profile.display_name) {
    parts.push(`The coach's name is ${profile.display_name}.`)
  }

  if (profile.club_name) {
    parts.push(`They coach at ${profile.club_name}.`)
  }

  if (profile.age_group) {
    parts.push(`They work with ${profile.age_group} ${terms.player}s.`)
  }

  if (profile.coaching_level) {
    const levelDescriptions: Record<string, string> = {
      grassroots: `a grassroots/community level coach working with recreational ${terms.player}s`,
      academy: `an academy coach focused on ${terms.player} development`,
      "semi-pro": `a semi-professional coach balancing development and results`,
      professional: `a professional coach at a high level`,
    }
    parts.push(`They are ${levelDescriptions[profile.coaching_level] || profile.coaching_level}.`)
  }

  if (memory) {
    if (memory.coaching_style?.length) {
      parts.push(`Their coaching style tends to be: ${memory.coaching_style.join(", ")}.`)
    }

    if (memory.common_challenges?.length) {
      parts.push(`Recurring challenges they face: ${memory.common_challenges.join(", ")}.`)
    }

    if (memory.strengths?.length) {
      parts.push(`Their strengths as a coach: ${memory.strengths.join(", ")}.`)
    }

    if (memory.goals?.length) {
      parts.push(`They're currently working on: ${memory.goals.join(", ")}.`)
    }

    if (memory.team_context) {
      parts.push(`Current ${terms.team} context: ${memory.team_context}`)
    }
  }

  if (parts.length === 0) {
    return ""
  }

  return `\n\n## About This Coach\n${parts.join(" ")}`
}
