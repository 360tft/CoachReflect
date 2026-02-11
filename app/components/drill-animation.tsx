'use client'

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import {
  DrillSchema,
  AnimationStep,
  CONE_COLORS,
  TEAM_COLORS,
  EASING_FUNCTIONS,
} from '@/lib/drill-schema'
import { renderSurface } from '@/lib/surface-renderers'

export interface DrillAnimationHandle {
  getCanvas: () => HTMLCanvasElement | null
  playForRecording: () => void
}

interface DrillAnimationProps {
  drill: DrillSchema
  width?: number
  height?: number
  autoPlay?: boolean
  showControls?: boolean
  showDescription?: boolean
  responsive?: boolean
  onComplete?: () => void
  hint?: string
}

interface AnimationState {
  players: Map<string, { x: number; y: number; team: string; hasBall: boolean; label?: string }>
  balls: Map<string, { x: number; y: number; heldBy?: string }>
}

// Color manipulation helpers for gradients
function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + amount)
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount)
  const b = Math.min(255, (num & 0x0000ff) + amount)
  return `rgb(${r}, ${g}, ${b})`
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount)
  const b = Math.max(0, (num & 0x0000ff) - amount)
  return `rgb(${r}, ${g}, ${b})`
}

// Arrow trail for showing action paths during a step
interface ActionTrail {
  type: 'pass' | 'run' | 'dribble' | 'shoot' | 'move'
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number // 0-1 how far along the animation is
}

export const DrillAnimation = forwardRef<DrillAnimationHandle, DrillAnimationProps>(function DrillAnimation({
  drill,
  width = 500,
  height = 500,
  autoPlay = false,
  showControls = true,
  showDescription = true,
  responsive = true,
  onComplete,
  hint,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentStep, setCurrentStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [cycle, setCycle] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [recordingMode, setRecordingMode] = useState(false)
  const trailsRef = useRef<ActionTrail[]>([])

  // Expose imperative handle for video recording
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    playForRecording: () => {
      setRecordingMode(true)
      setCurrentStep(0)
      setStepProgress(0)
      setCycle(0)
      setState(getInitialState())
      setSpeed(1)
      trailsRef.current = []
      // Start playing on next tick after state settles
      setTimeout(() => setIsPlaying(true), 50)
    },
  }))

  // Responsive sizing: measure container and cap at max width/height
  useEffect(() => {
    if (!responsive || !containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(containerRef.current)
    // Initial measurement
    setContainerWidth(containerRef.current.clientWidth)

    return () => observer.disconnect()
  }, [responsive])

  const displayWidth = responsive && containerWidth > 0 ? Math.min(containerWidth, width) : width
  const pitchHeight = displayWidth // Keep square aspect ratio for the pitch
  const brandBarHeight = recordingMode ? 44 : 0
  const displayHeight = pitchHeight + brandBarHeight

  // Initialize animation state from drill
  const getInitialState = useCallback((): AnimationState => {
    const players = new Map<string, { x: number; y: number; team: string; hasBall: boolean; label?: string }>()
    const balls = new Map<string, { x: number; y: number; heldBy?: string }>()

    drill.players.forEach(p => {
      players.set(p.id, { x: isFinite(p.x) ? p.x : 50, y: isFinite(p.y) ? p.y : 50, team: p.team, hasBall: p.hasBall, label: p.label })
    })

    drill.balls.forEach(b => {
      balls.set(b.id, { x: isFinite(b.x) ? b.x : 50, y: isFinite(b.y) ? b.y : 50, heldBy: b.heldBy })
    })

    return { players, balls }
  }, [drill])

  const [state, setState] = useState<AnimationState>(getInitialState)

  // Apply final state changes for a single step to a given animation state
  const applyStepChanges = useCallback((prevState: AnimationState, step: AnimationStep): AnimationState => {
    const newPlayers = new Map(prevState.players)
    const newBalls = new Map(prevState.balls)

    step.actions.forEach(action => {
      if (action.to && typeof action.to === 'object') {
        const toX = isFinite(action.to.x) ? action.to.x : undefined
        const toY = isFinite(action.to.y) ? action.to.y : undefined
        if (toX !== undefined && toY !== undefined) {
          if (action.type === 'run' || action.type === 'dribble' || action.type === 'move') {
            const player = newPlayers.get(action.subject)
            if (player) {
              newPlayers.set(action.subject, { ...player, x: toX, y: toY })
            }
          }
          if (action.type === 'pass' || action.type === 'shoot') {
            const ball = newBalls.get(action.subject)
            if (ball) {
              newBalls.set(action.subject, { ...ball, x: toX, y: toY, heldBy: undefined })
            }
          }
        }
      }

      action.stateChanges?.forEach(change => {
        const player = newPlayers.get(change.playerId)
        if (player) {
          newPlayers.set(change.playerId, {
            ...player,
            ...change.changes,
            team: change.changes.team || player.team,
          })
        }
      })

      if (action.transferBall && action.to) {
        const targetId = typeof action.to === 'string' ? action.to : null
        if (targetId) {
          const targetPlayer = newPlayers.get(targetId)
          if (targetPlayer) {
            newPlayers.set(targetId, { ...targetPlayer, hasBall: true })
          }
        }
      }
    })

    return { players: newPlayers, balls: newBalls }
  }, [])

  // Compute animation state at a given step by replaying from initial state
  const computeStateAtStep = useCallback((targetStep: number): AnimationState => {
    let s = getInitialState()
    for (let i = 0; i < targetStep; i++) {
      const step = drill.sequence[i]
      if (step) {
        s = applyStepChanges(s, step)
      }
    }
    return s
  }, [getInitialState, drill.sequence, applyStepChanges])

  // Step forward one step (pauses playback)
  const stepForward = useCallback(() => {
    setIsPlaying(false)
    trailsRef.current = []

    if (currentStep < drill.sequence.length - 1) {
      const step = drill.sequence[currentStep]
      if (step) {
        setState(prev => applyStepChanges(prev, step))
      }
      setCurrentStep(prev => prev + 1)
      setStepProgress(0)
    } else if (cycle < drill.cycles - 1) {
      // Wrap to next cycle
      setCycle(prev => prev + 1)
      setCurrentStep(0)
      setStepProgress(0)
      setState(getInitialState())
    }
  }, [currentStep, cycle, drill, applyStepChanges, getInitialState])

  // Step backward one step (pauses playback)
  const stepBackward = useCallback(() => {
    setIsPlaying(false)
    trailsRef.current = []

    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      setStepProgress(0)
      setState(computeStateAtStep(newStep))
    } else if (cycle > 0) {
      // Go to last step of previous cycle
      setCycle(prev => prev - 1)
      const lastStep = drill.sequence.length - 1
      setCurrentStep(lastStep)
      setStepProgress(0)
      setState(computeStateAtStep(lastStep))
    }
  }, [currentStep, cycle, drill.sequence.length, computeStateAtStep])

  const canStepBackward = currentStep > 0 || cycle > 0
  const canStepForward = currentStep < drill.sequence.length - 1 || cycle < drill.cycles - 1

  // Reset animation
  const reset = useCallback(() => {
    setCurrentStep(0)
    setStepProgress(0)
    setCycle(0)
    setState(getInitialState())
    setIsPlaying(false)
    trailsRef.current = []
  }, [getInitialState])

  // Helper: draw a rounded rectangle path
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  // Draw the current frame
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // HiDPI support
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
      ctx.scale(dpr, dpr)
    }

    const scale = Math.min(displayWidth, pitchHeight) || 100
    const padding = 24

    // Helper to convert 0-100 coordinates to canvas pixels (guards against NaN/Infinity)
    const toX = (x: number) => isFinite(x) ? (x / 100) * (displayWidth - padding * 2) + padding : displayWidth / 2
    const toY = (y: number) => isFinite(y) ? (y / 100) * (pitchHeight - padding * 2) + padding : pitchHeight / 2

    // --- SURFACE RENDERING (sport-specific pitch/court/field) ---
    renderSurface(drill.sport || 'football', {
      ctx,
      displayWidth,
      pitchHeight,
      padding,
      pitchShape: drill.pitch.shape,
      isSetPiece: drill.type === 'set-piece',
      setPieceType: drill.setPieceType,
    })

    // --- ZONES ---
    drill.zones?.forEach(zone => {
      const zx = toX(zone.x)
      const zy = toY(zone.y)
      const zw = (zone.width / 100) * (displayWidth - padding * 2)
      const zh = (zone.height / 100) * (pitchHeight - padding * 2)
      const zoneR = 4

      // Semi-transparent fill with rounded corners
      ctx.globalAlpha = zone.opacity * 0.45
      roundRect(ctx, zx, zy, zw, zh, zoneR)
      ctx.fillStyle = zone.color
      ctx.fill()
      ctx.globalAlpha = 1

      // Inner glow at edges
      const innerGlow = ctx.createLinearGradient(zx, zy, zx, zy + zh)
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)')
      innerGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0)')
      innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0.08)')
      roundRect(ctx, zx, zy, zw, zh, zoneR)
      ctx.fillStyle = innerGlow
      ctx.fill()

      // Dashed border
      ctx.setLineDash([6, 4])
      roundRect(ctx, zx, zy, zw, zh, zoneR)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])

      // Zone label with text shadow
      if (zone.label) {
        const fontSize = Math.max(10, scale * 0.024)
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillText(zone.label, zx + zw / 2 + 1, zy + zh / 2 + 1)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fillText(zone.label, zx + zw / 2, zy + zh / 2)
      }
    })

    // --- GOALS ---
    drill.goals?.forEach(goal => {
      const goalWidth = (goal.width / 100) * (displayWidth - padding * 2)
      const goalHeight = goalWidth * 0.3
      const postWidth = 4
      ctx.save()
      ctx.translate(toX(goal.x), toY(goal.y))
      ctx.rotate((goal.rotation * Math.PI) / 180)

      // Goal net background
      const netGrad = ctx.createLinearGradient(0, -goalHeight / 2, 0, goalHeight / 2)
      netGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
      netGrad.addColorStop(1, 'rgba(255, 255, 255, 0.18)')
      ctx.fillStyle = netGrad
      ctx.fillRect(-goalWidth / 2, -goalHeight / 2, goalWidth, goalHeight)

      // Cross-hatch net pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 0.5
      const netSpacing = goalWidth / 10
      for (let i = 1; i < 10; i++) {
        ctx.beginPath()
        ctx.moveTo(-goalWidth / 2 + i * netSpacing, -goalHeight / 2)
        ctx.lineTo(-goalWidth / 2 + i * netSpacing, goalHeight / 2)
        ctx.stroke()
      }
      const netVSpacing = goalHeight / 4
      for (let i = 1; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(-goalWidth / 2, -goalHeight / 2 + i * netVSpacing)
        ctx.lineTo(goalWidth / 2, -goalHeight / 2 + i * netVSpacing)
        ctx.stroke()
      }

      // Goal posts (white with slight shadow)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(-goalWidth / 2 - 1, -goalHeight / 2 + 1, postWidth + 1, goalHeight)
      ctx.fillRect(goalWidth / 2 - postWidth, -goalHeight / 2 + 1, postWidth + 1, goalHeight)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-goalWidth / 2, -goalHeight / 2, postWidth, goalHeight)
      ctx.fillRect(goalWidth / 2 - postWidth, -goalHeight / 2, postWidth, goalHeight)

      // Crossbar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(-goalWidth / 2, -goalHeight / 2 + 1, goalWidth, postWidth + 1)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-goalWidth / 2, -goalHeight / 2, goalWidth, postWidth)

      ctx.restore()
    })

    // --- CONES ---
    const coneSize = scale * 0.02
    ;(drill.cones || []).forEach(cone => {
      const cx = toX(cone.x)
      const cy = toY(cone.y)
      const baseColor = CONE_COLORS[cone.color]

      // Cone shadow
      ctx.beginPath()
      ctx.ellipse(cx + 1, cy + coneSize * 0.6, coneSize * 0.6, coneSize * 0.2, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.fill()

      // 3D cone body with gradient
      ctx.beginPath()
      ctx.moveTo(cx, cy - coneSize)
      ctx.lineTo(cx - coneSize * 0.7, cy + coneSize * 0.45)
      ctx.lineTo(cx + coneSize * 0.7, cy + coneSize * 0.45)
      ctx.closePath()

      const coneGrad = ctx.createLinearGradient(cx - coneSize * 0.7, cy, cx + coneSize * 0.7, cy)
      coneGrad.addColorStop(0, baseColor)
      coneGrad.addColorStop(0.35, baseColor)
      coneGrad.addColorStop(0.5, '#ffffff')
      coneGrad.addColorStop(0.65, baseColor)
      coneGrad.addColorStop(1, baseColor)
      ctx.fillStyle = coneGrad
      ctx.fill()

      // Outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Cone label
      if (cone.label) {
        const labelSize = Math.max(8, scale * 0.016)
        ctx.font = `bold ${labelSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillText(cone.label, cx + 0.5, cy + coneSize * 0.7 + 0.5)
        ctx.fillStyle = '#fff'
        ctx.fillText(cone.label, cx, cy + coneSize * 0.7)
      }
    })

    // --- ACTION TRAILS (arrows showing passes/runs) ---
    const currentTrails = trailsRef.current
    currentTrails.forEach(trail => {
      const fx = toX(trail.fromX)
      const fy = toY(trail.fromY)
      const tx = toX(trail.toX)
      const ty = toY(trail.toY)

      // Calculate the drawn endpoint based on progress
      const endX = fx + (tx - fx) * trail.progress
      const endY = fy + (ty - fy) * trail.progress

      const isPass = trail.type === 'pass' || trail.type === 'shoot'
      const isRun = trail.type === 'run' || trail.type === 'move'
      const isDribble = trail.type === 'dribble'

      ctx.save()

      // Glow effect for arrows
      if (isPass) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
        ctx.shadowBlur = 6
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.setLineDash([])
      } else if (isRun) {
        ctx.shadowColor = 'rgba(255, 235, 59, 0.4)'
        ctx.shadowBlur = 5
        ctx.strokeStyle = '#ffeb3b'
        ctx.lineWidth = 2.5
        ctx.setLineDash([10, 6])
      } else if (isDribble) {
        ctx.shadowColor = 'rgba(100, 200, 255, 0.4)'
        ctx.shadowBlur = 4
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.85)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([4, 4])
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.lineWidth = 2
        ctx.setLineDash([])
      }

      // Draw curved line using a subtle bezier curve
      const dx = tx - fx
      const dy = ty - fy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const curvature = dist * 0.08
      // Perpendicular offset for curve
      const nx = -dy / dist * curvature
      const ny = dx / dist * curvature
      const cpx = (fx + endX) / 2 + nx
      const cpy = (fy + endY) / 2 + ny

      ctx.beginPath()
      ctx.moveTo(fx, fy)
      ctx.quadraticCurveTo(cpx, cpy, endX, endY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.shadowBlur = 0

      // Filled arrowhead at the drawn endpoint
      if (trail.progress > 0.1) {
        const arrowLen = 12
        const arrowW = 5
        // Get angle at the endpoint of the curve
        const t = 0.98
        const qx = (1 - t) * (1 - t) * fx + 2 * (1 - t) * t * cpx + t * t * endX
        const qy = (1 - t) * (1 - t) * fy + 2 * (1 - t) * t * cpy + t * t * endY
        const angle = Math.atan2(endY - qy, endX - qx)

        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowLen * Math.cos(angle - Math.PI / arrowW),
          endY - arrowLen * Math.sin(angle - Math.PI / arrowW)
        )
        ctx.lineTo(
          endX - arrowLen * 0.6 * Math.cos(angle),
          endY - arrowLen * 0.6 * Math.sin(angle)
        )
        ctx.lineTo(
          endX - arrowLen * Math.cos(angle + Math.PI / arrowW),
          endY - arrowLen * Math.sin(angle + Math.PI / arrowW)
        )
        ctx.closePath()
        ctx.fillStyle = isRun ? '#ffeb3b' : isDribble ? 'rgba(100, 200, 255, 0.9)' : '#ffffff'
        ctx.fill()
      }

      ctx.restore()
    })

    // --- PLAYERS ---
    const playerRadius = scale * 0.04
    state.players.forEach((player, id) => {
      const px = toX(player.x)
      const py = toY(player.y)
      const teamColor = TEAM_COLORS[player.team as keyof typeof TEAM_COLORS] || '#666'

      // Drop shadow
      ctx.beginPath()
      ctx.ellipse(px + 2, py + 4, playerRadius * 0.85, playerRadius * 0.4, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.fill()

      // Outer ring glow (subtle)
      ctx.beginPath()
      ctx.arc(px, py, playerRadius + 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.fill()

      // Player circle with gradient
      ctx.beginPath()
      ctx.arc(px, py, playerRadius, 0, Math.PI * 2)
      const playerGrad = ctx.createRadialGradient(
        px - playerRadius * 0.3, py - playerRadius * 0.3, 0,
        px, py, playerRadius
      )
      playerGrad.addColorStop(0, lightenColor(teamColor, 40))
      playerGrad.addColorStop(0.7, teamColor)
      playerGrad.addColorStop(1, darkenColor(teamColor, 30))
      ctx.fillStyle = playerGrad
      ctx.fill()

      // White border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Player label inside circle
      const label = player.label || id
      const labelSize = Math.max(10, playerRadius * 0.75)
      ctx.font = `bold ${labelSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Text shadow for readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillText(label, px + 0.5, py + 0.5)

      // Text color
      if (player.team === 'white' || player.team === 'yellow') {
        ctx.fillStyle = '#1a1a1a'
      } else {
        ctx.fillStyle = '#ffffff'
      }
      ctx.fillText(label, px, py)

      // Ball indicator
      if (player.hasBall) {
        const ballOffX = px + playerRadius * 0.85
        const ballOffY = py + playerRadius * 0.55
        const ballR = scale * 0.014

        // Ball glow
        ctx.beginPath()
        ctx.arc(ballOffX, ballOffY, ballR + 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fill()

        // Ball body
        ctx.beginPath()
        ctx.arc(ballOffX, ballOffY, ballR, 0, Math.PI * 2)
        const ballGrad = ctx.createRadialGradient(
          ballOffX - ballR * 0.3, ballOffY - ballR * 0.3, 0,
          ballOffX, ballOffY, ballR
        )
        ballGrad.addColorStop(0, '#ffffff')
        ballGrad.addColorStop(1, '#cccccc')
        ctx.fillStyle = ballGrad
        ctx.fill()
        ctx.strokeStyle = '#555'
        ctx.lineWidth = 1
        ctx.stroke()

        // Ball pattern
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
          const pentX = ballOffX + Math.cos(angle) * ballR * 0.45
          const pentY = ballOffY + Math.sin(angle) * ballR * 0.45
          if (i === 0) ctx.moveTo(pentX, pentY)
          else ctx.lineTo(pentX, pentY)
        }
        ctx.closePath()
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    })

    // --- FREE BALLS ---
    const ballRadius = scale * 0.018
    state.balls.forEach((ball) => {
      if (!ball.heldBy) {
        const bx = toX(ball.x)
        const by = toY(ball.y)

        // Ball shadow
        ctx.beginPath()
        ctx.ellipse(bx + 1, by + 3, ballRadius * 0.8, ballRadius * 0.35, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fill()

        // Ball glow
        ctx.beginPath()
        ctx.arc(bx, by, ballRadius + 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fill()

        // Ball body with gradient
        ctx.beginPath()
        ctx.arc(bx, by, ballRadius, 0, Math.PI * 2)
        const ballGrad = ctx.createRadialGradient(
          bx - ballRadius * 0.3, by - ballRadius * 0.3, 0,
          bx, by, ballRadius
        )
        ballGrad.addColorStop(0, '#ffffff')
        ballGrad.addColorStop(1, '#c8c8c8')
        ctx.fillStyle = ballGrad
        ctx.fill()
        ctx.strokeStyle = '#555'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Pentagon pattern
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
          const pentX = bx + Math.cos(angle) * ballRadius * 0.45
          const pentY = by + Math.sin(angle) * ballRadius * 0.45
          if (i === 0) ctx.moveTo(pentX, pentY)
          else ctx.lineTo(pentX, pentY)
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    })

    // --- TITLE BAR ---
    if (drill.name) {
      const titleH = 28
      roundRect(ctx, 8, 4, displayWidth - 16, titleH, 6)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
      ctx.fill()

      const titleSize = Math.max(11, scale * 0.024)
      ctx.font = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillText(drill.name, displayWidth / 2, 4 + titleH / 2)
    }

    // Step description is now rendered as HTML below the canvas

    // --- WATERMARK ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.font = `bold ${Math.max(9, scale * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText('coachreflection.com', displayWidth - padding + 4, pitchHeight - 2)

    // --- BRANDED FOOTER BAR (recording mode only) ---
    if (recordingMode) {
      const barY = pitchHeight
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, barY, displayWidth, brandBarHeight)

      // Gold "coachreflection.com" text
      const brandFontSize = Math.max(16, displayWidth * 0.034)
      ctx.font = `bold ${brandFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#E5A11C'
      ctx.fillText('coachreflection.com', displayWidth / 2, barY + brandBarHeight * 0.42)

      // Tagline
      const tagFontSize = Math.max(9, displayWidth * 0.018)
      ctx.font = `500 ${tagFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.fillText('Coaching Reflection Journal', displayWidth / 2, barY + brandBarHeight * 0.78)
    }
  }, [drill, displayWidth, pitchHeight, displayHeight, brandBarHeight, recordingMode, state, currentStep])

  // Build action trails for the current step
  const updateTrails = useCallback((step: AnimationStep, progress: number) => {
    const trails: ActionTrail[] = []

    step.actions.forEach(action => {
      if (action.to && typeof action.to === 'object' && action.from) {
        trails.push({
          type: action.type as ActionTrail['type'],
          fromX: action.from.x,
          fromY: action.from.y,
          toX: action.to.x,
          toY: action.to.y,
          progress: Math.min(1, progress),
        })
      } else if (action.to && typeof action.to === 'object') {
        // No explicit from — use current player/ball position from initial state
        const isPlayerAction = action.type === 'run' || action.type === 'dribble' || action.type === 'move'
        const isBallAction = action.type === 'pass' || action.type === 'shoot'

        let fromX = action.to.x
        let fromY = action.to.y

        if (isPlayerAction) {
          const player = drill.players.find(p => p.id === action.subject)
          if (player) {
            fromX = player.x
            fromY = player.y
          }
        } else if (isBallAction) {
          const ball = drill.balls.find(b => b.id === action.subject)
          if (ball) {
            fromX = ball.x
            fromY = ball.y
          }
        }

        trails.push({
          type: action.type as ActionTrail['type'],
          fromX,
          fromY,
          toX: action.to.x,
          toY: action.to.y,
          progress: Math.min(1, progress),
        })
      }
    })

    trailsRef.current = trails
  }, [drill])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      draw()
      return
    }

    let lastTime = performance.now()
    const step = drill.sequence[currentStep]
    if (!step) {
      setIsPlaying(false)
      setRecordingMode(false)
      onComplete?.()
      return
    }

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) * speed
      lastTime = currentTime

      setStepProgress(prev => {
        const newProgress = prev + deltaTime

        if (newProgress >= step.duration) {
          // Apply final state changes for this step
          setState(prevState => applyStepChanges(prevState, step))

          // Clear trails at step transition
          trailsRef.current = []

          // Move to next step
          if (currentStep < drill.sequence.length - 1) {
            setCurrentStep(prev => prev + 1)
            return 0
          } else {
            // Cycle complete
            if (cycle < drill.cycles - 1) {
              setCycle(prev => prev + 1)
              setCurrentStep(0)
              setState(getInitialState())
              return 0
            } else {
              setIsPlaying(false)
              setRecordingMode(false)
              onComplete?.()
              return step.duration
            }
          }
        }

        // Interpolate positions during animation
        const t = step.duration > 0 ? newProgress / step.duration : 1
        updateTrails(step, t)

        setState(prevState => {
          const newPlayers = new Map(prevState.players)
          const newBalls = new Map(prevState.balls)

          step.actions.forEach(action => {
            const easing = EASING_FUNCTIONS[action.easing || 'easeInOut']
            const easedT = easing(t)

            if (action.to && typeof action.to === 'object' && isFinite(action.to.x) && isFinite(action.to.y)) {
              if (action.type === 'run' || action.type === 'dribble' || action.type === 'move') {
                const player = newPlayers.get(action.subject)
                if (player) {
                  const fromX = action.from?.x ?? player.x
                  const fromY = action.from?.y ?? player.y
                  newPlayers.set(action.subject, {
                    ...player,
                    x: fromX + (action.to.x - fromX) * easedT,
                    y: fromY + (action.to.y - fromY) * easedT,
                  })
                }
              }
              if (action.type === 'pass' || action.type === 'shoot') {
                const ball = newBalls.get(action.subject)
                if (ball) {
                  const fromX = action.from?.x ?? ball.x
                  const fromY = action.from?.y ?? ball.y
                  newBalls.set(action.subject, {
                    ...ball,
                    x: fromX + (action.to.x - fromX) * easedT,
                    y: fromY + (action.to.y - fromY) * easedT,
                    heldBy: undefined,
                  })
                }
              }
            }
          })

          return { players: newPlayers, balls: newBalls }
        })

        return newProgress
      })

      draw()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, currentStep, cycle, drill, speed, draw, getInitialState, onComplete, updateTrails, applyStepChanges])

  // Initial draw
  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div className="flex flex-col items-center gap-3 w-full" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-lg ring-1 ring-white/10"
        style={{ width: displayWidth, height: displayHeight }}
      />

      {showDescription && drill.sequence[currentStep]?.description && (
        <div className="w-full flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm rounded-lg px-3 py-2 ring-1 ring-white/10">
          <span className="flex-shrink-0 text-[11px] font-bold text-gray-400 bg-white/10 rounded-full px-2 py-0.5">
            {currentStep + 1}/{drill.sequence.length}
          </span>
          <p className="text-sm text-white font-medium">
            {drill.sequence[currentStep].description}
          </p>
        </div>
      )}

      {showControls && (
        <div className="flex items-center gap-2 flex-wrap justify-center bg-gray-800/60 rounded-lg px-3 py-2 backdrop-blur-sm ring-1 ring-white/10">
          <button
            onClick={stepBackward}
            disabled={!canStepBackward}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous step"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-[#E5A11C] text-white rounded-lg hover:bg-[#d4940f] min-h-[44px] font-semibold transition-all shadow-sm active:scale-95"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={stepForward}
            disabled={!canStepForward}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next step"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 min-h-[44px] font-medium transition-all shadow-sm active:scale-95"
          >
            Reset
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="drill-speed" className="text-xs text-gray-400 font-medium uppercase tracking-wider">Speed</label>
            <select
              id="drill-speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="px-2 py-1 border border-gray-600 rounded-lg bg-gray-900 text-white min-h-[44px] text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          <div className="text-xs text-gray-400 font-medium tabular-nums">
            Step {currentStep + 1}/{drill.sequence.length} &middot; Cycle {cycle + 1}/{drill.cycles}
          </div>
        </div>
      )}

      {hint && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-sm leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  )
})
