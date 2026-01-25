/**
 * User Memory System (Pro Feature)
 *
 * Provides context persistence across sessions so the AI "remembers" users.
 * - Stores learned facts about users (age group, club, what worked, etc.)
 * - Summarizes reflections for future reference
 * - Injects context into system prompts for personalized responses
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Types
export interface UserMemory {
  id: string
  userId: string
  coachingStyle: string[]
  commonChallenges: string[]
  strengths: string[]
  goals: string[]
  playerInfo: Record<string, unknown>
  teamContext: string | null
  lastUpdated: string
}

export interface ReflectionSummary {
  id: string
  date: string
  aiSummary: string | null
  whatWorked: string | null
  tags: string[]
}

export interface UserContext {
  profile: {
    displayName?: string
    clubName?: string
    ageGroup?: string
    coachingLevel?: string
    sport?: string
  }
  memory: UserMemory | null
  recentReflections: ReflectionSummary[]
  daysSinceLastReflection: number | null
  totalReflections: number
}

/**
 * Load user's memory and context
 */
export async function loadUserContext(userId: string): Promise<UserContext> {
  const supabase = createAdminClient()

  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, club_name, age_group, coaching_level, sport, total_reflections')
    .eq('user_id', userId)
    .single()

  // Load memory
  const { data: memoryData } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Load last 5 reflection summaries
  const { data: reflections } = await supabase
    .from('reflections')
    .select('id, date, ai_summary, what_worked, tags')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5)

  // Calculate days since last reflection
  let daysSinceLastReflection: number | null = null
  if (reflections && reflections.length > 0) {
    const lastDate = new Date(reflections[0].date)
    const now = new Date()
    daysSinceLastReflection = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  // Transform memory data
  const memory: UserMemory | null = memoryData
    ? {
        id: memoryData.id,
        userId: memoryData.user_id,
        coachingStyle: memoryData.coaching_style || [],
        commonChallenges: memoryData.common_challenges || [],
        strengths: memoryData.strengths || [],
        goals: memoryData.goals || [],
        playerInfo: memoryData.player_info || {},
        teamContext: memoryData.team_context,
        lastUpdated: memoryData.last_updated,
      }
    : null

  // Transform reflection summaries
  const recentReflections: ReflectionSummary[] = (reflections || []).map(r => ({
    id: r.id,
    date: r.date,
    aiSummary: r.ai_summary,
    whatWorked: r.what_worked,
    tags: r.tags || [],
  }))

  return {
    profile: {
      displayName: profile?.display_name,
      clubName: profile?.club_name,
      ageGroup: profile?.age_group,
      coachingLevel: profile?.coaching_level,
      sport: profile?.sport,
    },
    memory,
    recentReflections,
    daysSinceLastReflection,
    totalReflections: profile?.total_reflections || 0,
  }
}

/**
 * Build context block to inject into system prompt
 */
export function buildContextBlock(context: UserContext): string {
  const parts: string[] = []

  // Profile section
  const profileParts: string[] = []
  if (context.profile.ageGroup) profileParts.push(`coaching ${context.profile.ageGroup}`)
  if (context.profile.clubName) profileParts.push(`at ${context.profile.clubName}`)
  if (context.profile.coachingLevel) profileParts.push(`(${context.profile.coachingLevel} level)`)
  if (context.profile.sport && context.profile.sport !== 'football') {
    profileParts.push(`- ${context.profile.sport}`)
  }

  if (profileParts.length > 0) {
    parts.push(`**Profile:** ${profileParts.join(' ')}.`)
  }

  // Stats
  if (context.totalReflections > 0) {
    parts.push(`**Reflections logged:** ${context.totalReflections}`)
  }

  // Memory section
  if (context.memory) {
    if (context.memory.commonChallenges.length > 0) {
      parts.push(
        `**Common challenges:** ${context.memory.commonChallenges.slice(-3).join(', ')}`
      )
    }
    if (context.memory.strengths.length > 0) {
      parts.push(
        `**Strengths:** ${context.memory.strengths.slice(-3).join(', ')}`
      )
    }
    if (context.memory.goals.length > 0) {
      parts.push(
        `**Current goals:** ${context.memory.goals.slice(-2).join(', ')}`
      )
    }
    if (context.memory.teamContext) {
      parts.push(`**Team context:** ${context.memory.teamContext}`)
    }
  }

  // Recent reflections
  if (context.recentReflections.length > 0) {
    const summaries = context.recentReflections
      .filter(r => r.aiSummary || r.whatWorked)
      .slice(0, 3)
      .map(r => {
        const date = new Date(r.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        })
        return `- ${date}: ${r.aiSummary || r.whatWorked}`
      })
    if (summaries.length > 0) {
      parts.push(`**Recent reflections:**\n${summaries.join('\n')}`)
    }
  }

  // Returning user note
  if (context.daysSinceLastReflection !== null) {
    if (context.daysSinceLastReflection > 14) {
      parts.push(
        `\n*It's been ${context.daysSinceLastReflection} days since their last reflection. Gently welcome them back and confirm their situation is still the same.*`
      )
    }
  }

  if (parts.length === 0) {
    return ''
  }

  return `## USER CONTEXT (Pro Feature)

${parts.join('\n\n')}

**How to use this context:**
- Reference their situation naturally (e.g., "With your U12s at Riverside...")
- Build on past reflections where relevant
- Don't recite their profile robotically
- If something has changed, acknowledge and update your understanding
`
}

/**
 * Extract insights from a reflection to update memory
 */
export async function extractReflectionInsights(
  reflectionText: string
): Promise<{
  challenges: string[]
  strengths: string[]
  goals: string[]
  teamContext: string | null
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return { challenges: [], strengths: [], goals: [], teamContext: null }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Analyze this coaching reflection and extract key insights.

REFLECTION:
${reflectionText}

Respond in this exact JSON format (no markdown, just JSON):
{
  "challenges": ["challenge1", "challenge2"],
  "strengths": ["strength1"],
  "goals": ["goal1"],
  "teamContext": "brief description of team situation, or null"
}

Keep each item as a short phrase (2-5 words).
Only include items clearly mentioned in the reflection.
If nothing found for a category, use empty array.`

    const result = await model.generateContent(prompt)
    let text = result.response.text()?.trim() || '{}'

    // Strip markdown code blocks if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    const parsed = JSON.parse(text)
    return {
      challenges: parsed.challenges || [],
      strengths: parsed.strengths || [],
      goals: parsed.goals || [],
      teamContext: parsed.teamContext || null,
    }
  } catch (error) {
    console.error('Error extracting reflection insights:', error)
    return { challenges: [], strengths: [], goals: [], teamContext: null }
  }
}

/**
 * Update user memory after a reflection
 */
export async function updateUserMemory(
  userId: string,
  insights: {
    challenges: string[]
    strengths: string[]
    goals: string[]
    teamContext: string | null
  }
): Promise<void> {
  const supabase = createAdminClient()

  // Get existing memory
  const { data: existingMemory } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existingMemory) {
    // Merge new data with existing
    const updatedChallenges = [
      ...new Set([...existingMemory.common_challenges || [], ...insights.challenges]),
    ].slice(-10)

    const updatedStrengths = [
      ...new Set([...existingMemory.strengths || [], ...insights.strengths]),
    ].slice(-10)

    const updatedGoals = [
      ...new Set([...existingMemory.goals || [], ...insights.goals]),
    ].slice(-5)

    await supabase
      .from('user_memory')
      .update({
        common_challenges: updatedChallenges,
        strengths: updatedStrengths,
        goals: updatedGoals,
        team_context: insights.teamContext || existingMemory.team_context,
        last_updated: new Date().toISOString(),
      })
      .eq('id', existingMemory.id)
  } else {
    // Create new memory record
    await supabase.from('user_memory').insert({
      user_id: userId,
      common_challenges: insights.challenges,
      strengths: insights.strengths,
      goals: insights.goals,
      team_context: insights.teamContext,
      last_updated: new Date().toISOString(),
    })
  }
}

/**
 * Clear user memory (for Settings page)
 */
export async function clearUserMemory(userId: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('user_memory')
    .delete()
    .eq('user_id', userId)

  // Also clear AI summaries from reflections
  await supabase
    .from('reflections')
    .update({ ai_summary: null, ai_insights: null })
    .eq('user_id', userId)
}

/**
 * Get user memory for display in Settings
 */
export async function getUserMemoryDisplay(userId: string): Promise<{
  memory: UserMemory | null
  totalReflections: number
}> {
  const supabase = createAdminClient()

  const { data: memory } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { count } = await supabase
    .from('reflections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const transformedMemory: UserMemory | null = memory
    ? {
        id: memory.id,
        userId: memory.user_id,
        coachingStyle: memory.coaching_style || [],
        commonChallenges: memory.common_challenges || [],
        strengths: memory.strengths || [],
        goals: memory.goals || [],
        playerInfo: memory.player_info || {},
        teamContext: memory.team_context,
        lastUpdated: memory.last_updated,
      }
    : null

  return {
    memory: transformedMemory,
    totalReflections: count || 0,
  }
}
