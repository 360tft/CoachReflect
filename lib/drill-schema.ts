// DrillSchema - TypeScript types for representing animated drill diagrams across sports

export type DrillSport = 'football' | 'basketball' | 'rugby' | 'hockey' |
  'american_football' | 'tennis' | 'volleyball' | 'cricket'

export const SUPPORTED_DRILL_SPORTS: DrillSport[] = [
  'football', 'basketball', 'rugby', 'hockey',
  'american_football', 'tennis', 'volleyball', 'cricket',
]

export interface DrillSchema {
  id: string
  name: string
  description: string
  sport?: DrillSport
  category: 'technical' | 'tactical' | 'physical' | 'psychological' | 'small-sided-game' | 'set-piece'
  ageGroup?: string
  type?: 'drill' | 'set-piece'
  setPieceType?:
    // Football
    | 'corner' | 'free-kick' | 'throw-in' | 'goal-kick' | 'penalty'
    // Basketball
    | 'tip-off' | 'inbound' | 'free-throw'
    // Rugby
    | 'scrum' | 'lineout' | 'penalty-kick' | 'conversion' | 'drop-goal'
    // Hockey
    | 'penalty-corner' | 'free-hit' | 'penalty-stroke'
    // American Football
    | 'kickoff' | 'field-goal' | 'extra-point' | 'punt'
    // Tennis
    | 'serve' | 'return'
    // Volleyball
    | 'serve-receive' | 'rotation'
    // Cricket
    | 'powerplay' | 'death-overs'

  // Pitch setup
  pitch: {
    shape: 'square' | 'rectangle' | 'circle' | 'half-pitch' | 'full-pitch'
    width: number  // in metres (for display purposes)
    height: number // in metres
  }

  // Static elements
  cones?: Array<{
    id: string
    x: number      // 0-100 (percentage)
    y: number      // 0-100 (percentage)
    color: ConeColor
    label?: string
  }>

  goals?: Array<{
    id: string
    x: number
    y: number
    width: number  // as percentage of pitch
    rotation: number // degrees, 0 = facing down
    type: 'mini' | 'full' | 'popup'
  }>

  zones?: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    color: string  // hex or named
    opacity: number // 0-1
    label?: string
  }>

  // Players at start
  players: Array<{
    id: string
    x: number
    y: number
    team: TeamColor
    hasBall: boolean
    label?: string
    role?: string
  }>

  // Ball(s) - usually attached to players, but can be free
  balls: Array<{
    id: string
    x: number
    y: number
    heldBy?: string // player id
  }>

  // Animation sequence
  sequence: Array<AnimationStep>

  // How many times to loop the sequence
  cycles: number

  // Does the drill rotate/shift after each cycle?
  rotation?: {
    type: 'clockwise' | 'anticlockwise' | 'none'
    description: string
  }
}

export interface AnimationStep {
  // Unique step ID
  id: string

  // What happens in this step
  actions: Array<DrillAction>

  // How long this step takes (ms)
  duration: number

  // Optional description for this step (shown in UI)
  description?: string
}

export interface DrillAction {
  type: 'run' | 'dribble' | 'pass' | 'shoot' | 'move' | 'wait'

  // Who/what is moving
  subject: string // player id or ball id

  // Where from (if not current position)
  from?: { x: number; y: number }

  // Where to
  to?: { x: number; y: number } | string // coordinates or player/position id

  // Timing within the step
  startAt?: number   // ms from start of step (default 0)
  duration?: number  // ms (default: fills remaining step time)

  // Easing
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

  // For passes: does the receiver end up with the ball?
  transferBall?: boolean

  // Additional state changes
  stateChanges?: Array<{
    playerId: string
    changes: {
      team?: TeamColor
      hasBall?: boolean
      x?: number
      y?: number
    }
  }>
}

export type ConeColor = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'white'
export type TeamColor = 'black' | 'blue' | 'red' | 'yellow' | 'white' | 'green'

// Color mappings for rendering
export const CONE_COLORS: Record<ConeColor, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  blue: '#3b82f6',
  white: '#ffffff',
}

export const TEAM_COLORS: Record<TeamColor, string> = {
  black: '#1f2937',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#eab308',
  white: '#ffffff',
  green: '#22c55e',
}

// Easing functions
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
}
