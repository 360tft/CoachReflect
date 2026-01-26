// AI Response Formatting Standards for Coach Reflection
// Mobile-optimized response structure for reflection guidance

/**
 * Response format context block to inject into system prompts.
 * Creates consistent, mobile-friendly AI responses.
 */
export const RESPONSE_FORMAT_CONTEXT = `
## RESPONSE FORMATTING (CRITICAL - READ CAREFULLY)

Your outputs must be thoughtful, concise, and optimized for quick reading on mobile (3-5 minute max read time).

Always structure responses like this:

**0. START WITH CONTEXT ACKNOWLEDGEMENT**
If the user has profile data (sport, experience, role), acknowledge it first:
- "Based on your experience coaching [sport], let's reflect on [topic]."
- "For a [role] like yourself, here's how I'd think about [topic]."
If no profile data: "Let's explore [topic] together."

**1. BOLD OVERVIEW (1 line max)**
Write a short, bold overview sentence or title summarizing the insight.
Example: **Key Insight: Communication Timing Matters Most**

**2. NUMBERED FRAMEWORK (2-4 steps)**
Use numbered steps or a clear 2-4 step framework as the main structure.
Example:
**1. Notice the Pattern**
**2. Understand the Trigger**
**3. Plan the Adjustment**

**3. BOLD SUBHEADINGS**
Use **bold subheadings** for each major section.

**4. BULLET POINTS (CRITICAL)**
ALWAYS use bullet points when listing multiple tips, actions, or insights. NEVER bunch them into paragraph form.

BAD (never do this):
"Consider the timing. Think about your delivery. Notice player reactions. Adjust your approach."

GOOD (always do this):
- **Consider the timing** - Was the feedback given at the right moment?
- **Think about delivery** - How did your tone affect reception?
- **Notice reactions** - What body language did you observe?
- **Adjust your approach** - What would you do differently?

Rules for bullets:
- Keep each bullet short (1 sentence max, ideally <12 words)
- Bold the key phrase, then add brief explanation
- Start with action verbs where possible
- No nested bullets (keep flat)

**5. REFLECTIVE QUESTIONS**
Include 1-2 thoughtful questions to deepen reflection:
Example: "What would have happened if you'd given that feedback at half-time instead?"

**6. ACTION ITEM**
End with a clear, single action item or takeaway:
Example:
**Your Action:** Before your next session, write down 3 moments where you'll consciously pause before giving feedback.

**FORMATTING RULES:**
- Keep total length tight - prefer density over long paragraphs
- Break prose into short lines/paragraphs (max 1-2 sentences per paragraph)
- Use markdown sparingly but effectively: **bold** for emphasis, *italics* rarely
- No excessive horizontal rules or emojis
- Never write long introductory paragraphs
- Jump straight to value

**TONE:**
- Supportive, thought-provoking, coach-to-coach language
- Non-judgmental - reflection is about growth, not criticism
- Use coaching terminology appropriate to their sport
- Match the user's expertise level based on their profile
`

/**
 * Build system prompt with response format context appended
 */
export function buildSystemPromptWithFormat(basePrompt: string): string {
  return `${basePrompt}\n\n${RESPONSE_FORMAT_CONTEXT}`
}

/**
 * Profile acknowledgement templates for different scenarios
 */
export const PROFILE_ACKNOWLEDGEMENTS = {
  // With full profile
  withProfile: [
    "Based on your experience coaching {sport}, let's reflect on {topic}.",
    "For a {role} like yourself, here's how I'd think about {topic}.",
    "Given your {experienceLevel} in {sport}, let's explore {topic}.",
  ],
  // Without profile
  withoutProfile: [
    "Let's explore {topic} together.",
    "Here's what to consider about {topic}.",
    "Let's reflect on {topic}.",
  ],
} as const

/**
 * Build a coaching context string from profile data
 */
export function buildCoachingContext(profile: {
  sport?: string
  role?: string
  experienceYears?: number
  teamLevel?: string
}): string {
  const parts: string[] = []

  if (profile.sport) {
    parts.push(profile.sport)
  }
  if (profile.role) {
    parts.push(profile.role)
  }
  if (profile.teamLevel) {
    parts.push(`at ${profile.teamLevel} level`)
  }
  if (profile.experienceYears) {
    parts.push(`with ${profile.experienceYears} years experience`)
  }

  return parts.join(' ') || 'coaching'
}

/**
 * Validate that a response follows the expected format
 */
export interface FormatValidation {
  hasContextAck: boolean
  hasBoldOverview: boolean
  hasNumberedSteps: boolean
  hasBulletPoints: boolean
  hasActionItem: boolean
  score: number // 0-100
  issues: string[]
}

export function validateResponseFormat(response: string): FormatValidation {
  const issues: string[] = []

  // Check for context acknowledgement patterns
  const contextAckPatterns = /^(based on|for a|given your|let's|here's what)/i
  const hasContextAck = contextAckPatterns.test(response.trim())
  if (!hasContextAck) {
    issues.push('Missing context acknowledgement at start')
  }

  // Check for bold overview in first 500 chars
  const hasBoldOverview = /\*\*[^*]+\*\*/.test(response.substring(0, 500))
  if (!hasBoldOverview) {
    issues.push('Missing bold overview in first 500 chars')
  }

  // Check for numbered steps pattern
  const hasNumberedSteps = /\*\*\d+\.|^\d+\./m.test(response)
  if (!hasNumberedSteps) {
    issues.push('Missing numbered framework')
  }

  // Check for bullet points
  const hasBulletPoints = /^[-•]\s/m.test(response)
  if (!hasBulletPoints) {
    issues.push('Missing bullet points')
  }

  // Check for action item
  const hasActionItem = /\*\*(your action|action item|next step|takeaway|try this)/i.test(response)

  // Calculate score
  const checks = [hasContextAck, hasBoldOverview, hasNumberedSteps, hasBulletPoints, hasActionItem]
  const score = (checks.filter(Boolean).length / checks.length) * 100

  return {
    hasContextAck,
    hasBoldOverview,
    hasNumberedSteps,
    hasBulletPoints,
    hasActionItem,
    score,
    issues,
  }
}
