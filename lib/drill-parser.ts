// Utility to detect and parse drill diagram JSON from AI responses

import type { DrillSchema, DrillSport, ConeColor, TeamColor } from './drill-schema'
import { SUPPORTED_DRILL_SPORTS } from './drill-schema'

// Map common AI-generated color names to valid team colors
const TEAM_COLOR_ALIASES: Record<string, TeamColor> = {
  black: 'black', blue: 'blue', red: 'red', yellow: 'yellow', white: 'white', green: 'green',
  // Common AI mistakes
  orange: 'red', purple: 'blue', cyan: 'blue', pink: 'red', grey: 'black', gray: 'black',
  'team a': 'blue', 'team b': 'red', 'team_a': 'blue', 'team_b': 'red',
  attackers: 'blue', defenders: 'red', attacking: 'blue', defending: 'red',
  offense: 'blue', defense: 'red',
  a: 'blue', b: 'red',
}

const CONE_COLOR_ALIASES: Record<string, ConeColor> = {
  green: 'green', yellow: 'yellow', orange: 'orange', red: 'red', blue: 'blue', white: 'white',
  // Common AI mistakes
  black: 'red', purple: 'blue', cyan: 'blue', pink: 'red', grey: 'white', gray: 'white',
}

function normalizeTeamColor(color: string): TeamColor {
  const lower = color.toLowerCase().trim()
  return TEAM_COLOR_ALIASES[lower] || 'blue'
}

function normalizeConeColor(color: string): ConeColor {
  const lower = color.toLowerCase().trim()
  return CONE_COLOR_ALIASES[lower] || 'yellow'
}

/**
 * Detect drill diagram JSON in AI response content.
 * Supports multiple drill blocks in a single message (e.g. session plans with several exercises).
 * Looks for ```drill-diagram or ```json code blocks with drill schema.
 */
export function extractDrillFromContent(content: string): { cleanContent: string; drill: DrillSchema | null; drills: DrillSchema[] } {
  const drills: DrillSchema[] = []
  let cleanContent = content

  // First pass: explicit drill-diagram/drill code blocks
  const drillBlockPattern = /```(?:drill-diagram|drill)\s*\n([\s\S]*?)```/g
  let match
  while ((match = drillBlockPattern.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      const drill = normalizeDrillSchema(parsed)
      if (drill) {
        drills.push(drill)
        cleanContent = cleanContent.replace(match[0], '').trim()
      }
    } catch {
      // Not valid JSON, ignore
    }
  }

  // Second pass: JSON blocks that look like drill schemas (only if no explicit drill blocks found)
  if (drills.length === 0) {
    const jsonBlockPattern = /```json\s*\n([\s\S]*?)```/g
    while ((match = jsonBlockPattern.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1])
        const drill = normalizeDrillSchema(parsed)
        if (drill) {
          drills.push(drill)
          cleanContent = cleanContent.replace(match[0], '').trim()
        }
      } catch {
        // Not valid JSON or not a drill, continue
      }
    }
  }

  return { cleanContent, drill: drills[0] || null, drills }
}

/**
 * Validate and normalize a drill schema object.
 * More lenient than strict validation — fixes common AI mistakes
 * (wrong color names, missing optional fields) instead of rejecting.
 */
function normalizeDrillSchema(obj: unknown): DrillSchema | null {
  if (!obj || typeof obj !== 'object') return null

  const d = obj as Record<string, unknown>

  // Required fields for a drill
  if (typeof d.name !== 'string') return null
  if (!d.pitch || typeof d.pitch !== 'object') return null
  if (!Array.isArray(d.players)) return null
  if (!Array.isArray(d.sequence)) return null

  // Validate pitch has required fields
  const pitch = d.pitch as Record<string, unknown>
  if (!pitch.shape || !pitch.width || !pitch.height) return null

  // Normalize players — fix team colors instead of rejecting
  const players = d.players as Array<Record<string, unknown>>
  for (const player of players) {
    if (typeof player.id !== 'string') return null
    if (typeof player.x !== 'number') return null
    if (typeof player.y !== 'number') return null
    if (typeof player.team !== 'string') return null
    // Normalize team color (don't reject)
    player.team = normalizeTeamColor(player.team as string)
  }

  // Validate sequence has required fields
  const sequence = d.sequence as Array<Record<string, unknown>>
  for (const step of sequence) {
    if (typeof step.id !== 'string') return null
    if (!Array.isArray(step.actions)) return null
    if (typeof step.duration !== 'number') return null
  }

  // Normalize cones — fix colors instead of rejecting
  if (d.cones && Array.isArray(d.cones)) {
    const cones = d.cones as Array<Record<string, unknown>>
    for (const cone of cones) {
      if (typeof cone.id !== 'string') return null
      if (typeof cone.x !== 'number') return null
      if (typeof cone.y !== 'number') return null
      if (typeof cone.color === 'string') {
        cone.color = normalizeConeColor(cone.color as string)
      } else {
        cone.color = 'yellow' // default
      }
    }
  }

  // Ensure balls array exists (AI sometimes omits it)
  if (!Array.isArray(d.balls)) {
    d.balls = []
  }

  // Ensure cycles exists
  if (typeof d.cycles !== 'number') {
    d.cycles = 2
  }

  // Normalize sport field — default to 'football' for backwards compat
  if (!d.sport || typeof d.sport !== 'string' || !SUPPORTED_DRILL_SPORTS.includes(d.sport as DrillSport)) {
    d.sport = 'football'
  }

  // Default type to 'drill' if missing
  if (!d.type || (d.type !== 'drill' && d.type !== 'set-piece')) {
    d.type = 'drill'
  }

  // Validate setPieceType if present
  const validSetPieceTypes = [
    // Football
    'corner', 'free-kick', 'throw-in', 'goal-kick', 'penalty',
    // Basketball
    'tip-off', 'inbound', 'free-throw',
    // Rugby
    'scrum', 'lineout', 'penalty-kick', 'conversion', 'drop-goal',
    // Hockey
    'penalty-corner', 'free-hit', 'penalty-stroke',
    // American Football
    'kickoff', 'field-goal', 'extra-point', 'punt',
    // Tennis
    'serve', 'return',
    // Volleyball
    'serve-receive', 'rotation',
    // Cricket
    'powerplay', 'death-overs',
  ]
  if (d.setPieceType && !validSetPieceTypes.includes(d.setPieceType as string)) {
    d.setPieceType = undefined
  }

  // If type is set-piece but no setPieceType, default category
  if (d.type === 'set-piece' && !d.category) {
    d.category = 'set-piece'
  }

  return d as unknown as DrillSchema
}
