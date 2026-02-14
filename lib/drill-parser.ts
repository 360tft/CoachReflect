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

/** Coerce a value to a number, returning the fallback if not possible */
function toNumber(val: unknown, fallback: number): number {
  if (typeof val === 'number' && isFinite(val)) return val
  if (typeof val === 'string') {
    const n = Number(val)
    if (isFinite(n)) return n
  }
  return fallback
}

/**
 * Detect drill diagram JSON in AI response content.
 * Supports multiple drill blocks in a single message (e.g. session plans with several exercises).
 * Looks for ```drill-diagram or ```json code blocks with drill schema.
 * Always strips drill/json code blocks from displayed content, even if parsing fails.
 */
export function extractDrillFromContent(content: string): { cleanContent: string; drill: DrillSchema | null; drills: DrillSchema[] } {
  const drills: DrillSchema[] = []
  let cleanContent = content

  // First pass: explicit drill-diagram/drill code blocks (case-insensitive)
  const drillBlockPattern = /```(?:drill-diagram|drill)\s*\n([\s\S]*?)```/gi
  let match
  while ((match = drillBlockPattern.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(sanitizeJson(match[1]))
      const drill = normalizeDrillSchema(parsed)
      if (drill) {
        drills.push(drill)
      }
    } catch {
      // Not valid JSON — still remove the block from display
    }
    cleanContent = cleanContent.replace(match[0], '').trim()
  }

  // Second pass: JSON blocks that look like drill schemas (only if no explicit drill blocks found)
  if (drills.length === 0) {
    const jsonBlockPattern = /```json\s*\n([\s\S]*?)```/gi
    while ((match = jsonBlockPattern.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(sanitizeJson(match[1]))
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

  // Third pass: if we still found nothing, look for any code block containing drill-like JSON
  if (drills.length === 0) {
    const anyBlockPattern = /```\w*\s*\n([\s\S]*?)```/g
    while ((match = anyBlockPattern.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(sanitizeJson(match[1]))
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
 * Sanitize JSON string to handle common AI formatting issues:
 * - Trailing commas before } or ]
 * - Single-line comments
 */
function sanitizeJson(jsonStr: string): string {
  // Remove single-line comments
  let sanitized = jsonStr.replace(/\/\/[^\n]*/g, '')
  // Remove trailing commas before } or ]
  sanitized = sanitized.replace(/,\s*([}\]])/g, '$1')
  return sanitized.trim()
}

/**
 * Validate and normalize a drill schema object.
 * More lenient than strict validation — fixes common AI mistakes
 * (wrong color names, missing optional fields, string-typed numbers) instead of rejecting.
 */
function normalizeDrillSchema(obj: unknown): DrillSchema | null {
  if (!obj || typeof obj !== 'object') return null

  const d = obj as Record<string, unknown>

  // Must have a name (or title) — use fallback if missing
  if (typeof d.name !== 'string' && typeof d.title !== 'string') return null
  if (!d.name && d.title) d.name = d.title

  // Must have pitch
  if (!d.pitch || typeof d.pitch !== 'object') return null

  // Must have players array
  if (!Array.isArray(d.players) || d.players.length === 0) return null

  // Must have sequence array
  if (!Array.isArray(d.sequence) || d.sequence.length === 0) return null

  // Normalize pitch — coerce width/height to numbers
  const pitch = d.pitch as Record<string, unknown>
  if (!pitch.shape) pitch.shape = 'rectangle'
  pitch.width = toNumber(pitch.width, 30)
  pitch.height = toNumber(pitch.height, 20)

  // Normalize players — fix team colors and coerce coordinates
  const players = d.players as Array<Record<string, unknown>>
  for (let i = 0; i < players.length; i++) {
    const player = players[i]
    // Auto-generate id if missing
    if (typeof player.id !== 'string') {
      player.id = `p${i + 1}`
    }
    // Coerce coordinates to numbers
    player.x = toNumber(player.x, 50)
    player.y = toNumber(player.y, 50)
    // Normalize team color (don't reject)
    if (typeof player.team === 'string') {
      player.team = normalizeTeamColor(player.team as string)
    } else {
      player.team = 'blue'
    }
    // Default hasBall
    if (typeof player.hasBall !== 'boolean') {
      player.hasBall = false
    }
  }

  // Validate sequence — coerce duration to number, auto-generate ids
  const sequence = d.sequence as Array<Record<string, unknown>>
  for (let i = 0; i < sequence.length; i++) {
    const step = sequence[i]
    // Auto-generate id if missing
    if (typeof step.id !== 'string') {
      step.id = `step${i + 1}`
    }
    if (!Array.isArray(step.actions)) {
      step.actions = []
    }
    // Coerce duration to number — default 1500ms
    step.duration = toNumber(step.duration, 1500)

    // Normalize action coordinates
    const actions = step.actions as Array<Record<string, unknown>>
    for (const action of actions) {
      if (action.from && typeof action.from === 'object') {
        const from = action.from as Record<string, unknown>
        from.x = toNumber(from.x, 50)
        from.y = toNumber(from.y, 50)
      }
      if (action.to && typeof action.to === 'object') {
        const to = action.to as Record<string, unknown>
        to.x = toNumber(to.x, 50)
        to.y = toNumber(to.y, 50)
      }
    }
  }

  // Normalize cones — fix colors instead of rejecting
  if (d.cones && Array.isArray(d.cones)) {
    const cones = d.cones as Array<Record<string, unknown>>
    for (let i = 0; i < cones.length; i++) {
      const cone = cones[i]
      if (typeof cone.id !== 'string') cone.id = `c${i + 1}`
      cone.x = toNumber(cone.x, 50)
      cone.y = toNumber(cone.y, 50)
      if (typeof cone.color === 'string') {
        cone.color = normalizeConeColor(cone.color as string)
      } else {
        cone.color = 'yellow' // default
      }
    }
  }

  // Normalize goals
  if (d.goals && Array.isArray(d.goals)) {
    const goals = d.goals as Array<Record<string, unknown>>
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i]
      if (typeof goal.id !== 'string') goal.id = `g${i + 1}`
      goal.x = toNumber(goal.x, 50)
      goal.y = toNumber(goal.y, 0)
      goal.width = toNumber(goal.width, 12)
      goal.rotation = toNumber(goal.rotation, 0)
    }
  }

  // Normalize zones
  if (d.zones && Array.isArray(d.zones)) {
    const zones = d.zones as Array<Record<string, unknown>>
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i]
      if (typeof zone.id !== 'string') zone.id = `z${i + 1}`
      zone.x = toNumber(zone.x, 0)
      zone.y = toNumber(zone.y, 0)
      zone.width = toNumber(zone.width, 50)
      zone.height = toNumber(zone.height, 50)
      zone.opacity = toNumber(zone.opacity, 0.3)
    }
  }

  // Ensure balls array exists (AI sometimes omits it)
  if (!Array.isArray(d.balls)) {
    d.balls = []
  } else {
    // Normalize ball coordinates
    const balls = d.balls as Array<Record<string, unknown>>
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i]
      if (typeof ball.id !== 'string') ball.id = `ball${i > 0 ? i + 1 : ''}`
      ball.x = toNumber(ball.x, 50)
      ball.y = toNumber(ball.y, 50)
    }
  }

  // Ensure cycles exists
  if (typeof d.cycles !== 'number') {
    d.cycles = toNumber(d.cycles, 2)
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
