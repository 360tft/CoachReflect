// Surface renderers for multi-sport animated drill diagrams
// Each renderer draws the court/field/pitch markings on a canvas context.
// The animation engine (players, cones, zones, balls, trails) is sport-agnostic.

export interface SurfaceContext {
  ctx: CanvasRenderingContext2D
  displayWidth: number
  pitchHeight: number
  padding: number
  pitchShape: string
  isSetPiece: boolean
  setPieceType?: string
}

/** Dispatch to the correct sport renderer. Falls back to football for unknown sports. */
export function renderSurface(sport: string, context: SurfaceContext): void {
  const renderer = RENDERERS[sport] || renderFootballSurface
  renderer(context)
}

const RENDERERS: Record<string, (ctx: SurfaceContext) => void> = {
  football: renderFootballSurface,
  basketball: renderBasketballCourt,
  rugby: renderRugbyPitch,
  hockey: renderHockeyPitch,
  american_football: renderAmericanFootballField,
  tennis: renderTennisCourt,
  volleyball: renderVolleyballCourt,
  cricket: renderCricketGround,
}

// ─── FOOTBALL ───────────────────────────────────────────────────────────────
// Extracted from drill-animation.tsx — identical output to the original.

function renderFootballSurface({ ctx, displayWidth, pitchHeight, padding, pitchShape, isSetPiece, setPieceType }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#1a3a14'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  // Pitch area with radial gradient for depth
  const pitchGrad = ctx.createRadialGradient(
    displayWidth / 2, pitchHeight / 2, 0,
    displayWidth / 2, pitchHeight / 2, displayWidth * 0.7
  )
  pitchGrad.addColorStop(0, '#3a8c32')
  pitchGrad.addColorStop(0.5, '#348528')
  pitchGrad.addColorStop(1, '#2a6e20')
  ctx.fillStyle = pitchGrad
  ctx.fillRect(padding, padding, displayWidth - padding * 2, pitchHeight - padding * 2)

  // Alternating grass stripes
  const stripeCount = 12
  const pitchInnerW = displayWidth - padding * 2
  const stripeWidth = pitchInnerW / stripeCount
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.fillRect(padding + i * stripeWidth, padding, stripeWidth, pitchHeight - padding * 2)
  }

  // Subtle grass texture dots
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
  for (let i = 0; i < 200; i++) {
    const gx = padding + Math.random() * pitchInnerW
    const gy = padding + Math.random() * (pitchHeight - padding * 2)
    ctx.fillRect(gx, gy, 1, 1)
  }

  // White pitch outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.strokeRect(padding, padding, displayWidth - padding * 2, pitchHeight - padding * 2)

  // Centre line
  const midY = pitchHeight / 2
  ctx.beginPath()
  ctx.moveTo(padding, midY)
  ctx.lineTo(displayWidth - padding, midY)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Centre circle
  const centreCircleRadius = Math.min(displayWidth, pitchHeight) * 0.1
  ctx.beginPath()
  ctx.arc(displayWidth / 2, midY, centreCircleRadius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Centre spot
  ctx.beginPath()
  ctx.arc(displayWidth / 2, midY, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fill()

  // --- SET PIECE / PENALTY AREA MARKINGS ---
  const pitchLeft = padding
  const pitchRight = displayWidth - padding
  const pitchTop = padding
  const pitchBottom = pitchHeight - padding
  const pitchW = pitchRight - pitchLeft
  const pitchH = pitchBottom - pitchTop
  const pitchCentreX = displayWidth / 2

  const penAreaW = pitchW * 0.44
  const penAreaH = pitchH * 0.18
  const sixYardW = pitchW * 0.2
  const sixYardH = pitchH * 0.06
  const penSpotY = pitchH * 0.12
  const penArcRadius = pitchH * 0.08
  const cornerArcRadius = Math.min(displayWidth, pitchHeight) * 0.03

  const isHalfPitch = pitchShape === 'half-pitch'
  const isFullPitch = pitchShape === 'full-pitch'

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.setLineDash([])

  // Bottom penalty area
  if (isSetPiece || isHalfPitch || isFullPitch) {
    const bPenLeft = pitchCentreX - penAreaW / 2
    const bPenTop = pitchBottom - penAreaH
    ctx.strokeRect(bPenLeft, bPenTop, penAreaW, penAreaH)

    const bSixLeft = pitchCentreX - sixYardW / 2
    const bSixTop = pitchBottom - sixYardH
    ctx.strokeRect(bSixLeft, bSixTop, sixYardW, sixYardH)

    const bSpotY = pitchBottom - penSpotY
    ctx.beginPath()
    ctx.arc(pitchCentreX, bSpotY, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(pitchCentreX, bSpotY, penArcRadius, Math.PI + 0.6, Math.PI * 2 - 0.6)
    ctx.stroke()
  }

  // Top penalty area (full-pitch)
  if (isFullPitch) {
    const tPenLeft = pitchCentreX - penAreaW / 2
    ctx.strokeRect(tPenLeft, pitchTop, penAreaW, penAreaH)

    const tSixLeft = pitchCentreX - sixYardW / 2
    ctx.strokeRect(tSixLeft, pitchTop, sixYardW, sixYardH)

    const tSpotY = pitchTop + penSpotY
    ctx.beginPath()
    ctx.arc(pitchCentreX, tSpotY, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(pitchCentreX, tSpotY, penArcRadius, 0.6, Math.PI - 0.6)
    ctx.stroke()
  }

  // Corner arcs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(pitchLeft, pitchBottom, cornerArcRadius, -Math.PI / 2, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(pitchRight, pitchBottom, cornerArcRadius, Math.PI, Math.PI * 1.5)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(pitchLeft, pitchTop, cornerArcRadius, 0, Math.PI / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(pitchRight, pitchTop, cornerArcRadius, Math.PI / 2, Math.PI)
  ctx.stroke()

  // Larger corner arcs for corner set pieces
  if (isSetPiece && setPieceType === 'corner') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 2
    const largeCornerR = cornerArcRadius * 2.5
    ctx.beginPath()
    ctx.arc(pitchLeft, pitchBottom, largeCornerR, -Math.PI / 2, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(pitchRight, pitchBottom, largeCornerR, Math.PI, Math.PI * 1.5)
    ctx.stroke()
  }
}

// ─── BASKETBALL ─────────────────────────────────────────────────────────────

function renderBasketballCourt({ ctx, displayWidth, pitchHeight, padding }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#1a1008'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  const pL = padding
  const pR = displayWidth - padding
  const pT = padding
  const pB = pitchHeight - padding
  const pW = pR - pL
  const pH = pB - pT
  const cx = displayWidth / 2
  const midY = pitchHeight / 2

  // Hardwood floor with gradient
  const floorGrad = ctx.createLinearGradient(pL, pT, pR, pB)
  floorGrad.addColorStop(0, '#c4883a')
  floorGrad.addColorStop(0.5, '#d4984a')
  floorGrad.addColorStop(1, '#b47830')
  ctx.fillStyle = floorGrad
  ctx.fillRect(pL, pT, pW, pH)

  // Subtle wood grain lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
  ctx.lineWidth = 1
  const grainSpacing = pW / 16
  for (let i = 1; i < 16; i++) {
    ctx.beginPath()
    ctx.moveTo(pL + i * grainSpacing, pT)
    ctx.lineTo(pL + i * grainSpacing, pB)
    ctx.stroke()
  }

  // Court outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.strokeRect(pL, pT, pW, pH)

  // Half-court line
  ctx.beginPath()
  ctx.moveTo(pL, midY)
  ctx.lineTo(pR, midY)
  ctx.stroke()

  // Center circle
  const centerR = Math.min(pW, pH) * 0.09
  ctx.beginPath()
  ctx.arc(cx, midY, centerR, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.stroke()

  // --- TOP BASKET (y=0 side) ---
  const laneW = pW * 0.32
  const laneH = pH * 0.19
  const ftCircleR = laneW / 2

  // Free-throw lane (paint / key)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.strokeRect(cx - laneW / 2, pT, laneW, laneH)

  // Free-throw circle (top half solid, bottom half dashed)
  ctx.beginPath()
  ctx.arc(cx, pT + laneH, ftCircleR, Math.PI, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.arc(cx, pT + laneH, ftCircleR, 0, Math.PI)
  ctx.stroke()
  ctx.setLineDash([])

  // Three-point arc (top)
  const threeR = pW * 0.38
  const threeBaseY = pT + pH * 0.04
  ctx.beginPath()
  // Straight lines along the sides
  ctx.moveTo(cx - pW * 0.42, pT)
  ctx.lineTo(cx - pW * 0.42, threeBaseY)
  // Arc
  ctx.arc(cx, pT, threeR, Math.PI - Math.acos((pW * 0.42) / threeR), Math.acos((pW * 0.42) / threeR))
  ctx.lineTo(cx + pW * 0.42, pT)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Backboard and hoop (top)
  const bbW = pW * 0.12
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillRect(cx - bbW / 2, pT + pH * 0.02, bbW, 3)
  // Hoop
  const hoopR = pW * 0.025
  ctx.beginPath()
  ctx.arc(cx, pT + pH * 0.045, hoopR, 0, Math.PI * 2)
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // --- BOTTOM BASKET (y=100 side) ---
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.strokeRect(cx - laneW / 2, pB - laneH, laneW, laneH)

  // Free-throw circle (bottom)
  ctx.beginPath()
  ctx.arc(cx, pB - laneH, ftCircleR, 0, Math.PI)
  ctx.stroke()
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.arc(cx, pB - laneH, ftCircleR, Math.PI, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Three-point arc (bottom)
  const threeBaseYB = pB - pH * 0.04
  ctx.beginPath()
  ctx.moveTo(cx - pW * 0.42, pB)
  ctx.lineTo(cx - pW * 0.42, threeBaseYB)
  ctx.arc(cx, pB, threeR, Math.PI + Math.acos((pW * 0.42) / threeR), Math.PI * 2 - Math.acos((pW * 0.42) / threeR))
  ctx.lineTo(cx + pW * 0.42, pB)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Backboard and hoop (bottom)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillRect(cx - bbW / 2, pB - pH * 0.02 - 3, bbW, 3)
  ctx.beginPath()
  ctx.arc(cx, pB - pH * 0.045, hoopR, 0, Math.PI * 2)
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 2.5
  ctx.stroke()
}

// ─── RUGBY ──────────────────────────────────────────────────────────────────

function renderRugbyPitch({ ctx, displayWidth, pitchHeight, padding, isSetPiece }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#1a3a14'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  const pL = padding
  const pR = displayWidth - padding
  const pT = padding
  const pB = pitchHeight - padding
  const pW = pR - pL
  const pH = pB - pT
  const cx = displayWidth / 2

  // Grass
  const pitchGrad = ctx.createRadialGradient(cx, pitchHeight / 2, 0, cx, pitchHeight / 2, displayWidth * 0.7)
  pitchGrad.addColorStop(0, '#3a8c32')
  pitchGrad.addColorStop(0.5, '#348528')
  pitchGrad.addColorStop(1, '#2a6e20')
  ctx.fillStyle = pitchGrad
  ctx.fillRect(pL, pT, pW, pH)

  // Grass stripes
  const stripeCount = 12
  const stripeWidth = pW / stripeCount
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.fillRect(pL + i * stripeWidth, pT, stripeWidth, pH)
  }

  // Try zones (shaded areas at top and bottom)
  const tryZoneH = pH * 0.08
  ctx.fillStyle = 'rgba(50, 80, 200, 0.12)'
  ctx.fillRect(pL, pT, pW, tryZoneH)
  ctx.fillStyle = 'rgba(200, 50, 50, 0.12)'
  ctx.fillRect(pL, pB - tryZoneH, pW, tryZoneH)

  // Outer boundary
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.strokeRect(pL, pT, pW, pH)

  // Try lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(pL, pT + tryZoneH)
  ctx.lineTo(pR, pT + tryZoneH)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(pL, pB - tryZoneH)
  ctx.lineTo(pR, pB - tryZoneH)
  ctx.stroke()

  // Halfway line
  const midY = pitchHeight / 2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pL, midY)
  ctx.lineTo(pR, midY)
  ctx.stroke()

  // 22-metre lines (approx 22% from each try line)
  const line22T = pT + tryZoneH + pH * 0.22
  const line22B = pB - tryZoneH - pH * 0.22
  ctx.setLineDash([8, 4])
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(pL, line22T)
  ctx.lineTo(pR, line22T)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(pL, line22B)
  ctx.lineTo(pR, line22B)
  ctx.stroke()

  // 10-metre lines from halfway
  const line10T = midY - pH * 0.1
  const line10B = midY + pH * 0.1
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.beginPath()
  ctx.moveTo(pL, line10T)
  ctx.lineTo(pR, line10T)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(pL, line10B)
  ctx.lineTo(pR, line10B)
  ctx.stroke()
  ctx.setLineDash([])

  // Centre spot
  ctx.beginPath()
  ctx.arc(cx, midY, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fill()

  // H-posts (top and bottom)
  const postW = pW * 0.1
  const postH = pH * 0.03
  // Top posts
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - postW / 2, pT + tryZoneH - postH)
  ctx.lineTo(cx - postW / 2, pT + tryZoneH)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + postW / 2, pT + tryZoneH - postH)
  ctx.lineTo(cx + postW / 2, pT + tryZoneH)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - postW / 2, pT + tryZoneH)
  ctx.lineTo(cx + postW / 2, pT + tryZoneH)
  ctx.stroke()
  // Bottom posts
  ctx.beginPath()
  ctx.moveTo(cx - postW / 2, pB - tryZoneH)
  ctx.lineTo(cx - postW / 2, pB - tryZoneH + postH)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + postW / 2, pB - tryZoneH)
  ctx.lineTo(cx + postW / 2, pB - tryZoneH + postH)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - postW / 2, pB - tryZoneH)
  ctx.lineTo(cx + postW / 2, pB - tryZoneH)
  ctx.stroke()

  // "In-goal" labels
  if (isSetPiece || pH > 200) {
    ctx.font = `bold ${Math.max(9, pW * 0.022)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillText('IN-GOAL', cx, pT + tryZoneH / 2)
    ctx.fillText('IN-GOAL', cx, pB - tryZoneH / 2)
  }
}

// ─── HOCKEY ─────────────────────────────────────────────────────────────────

function renderHockeyPitch({ ctx, displayWidth, pitchHeight, padding, isSetPiece }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#0a2a2a'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  const pL = padding
  const pR = displayWidth - padding
  const pT = padding
  const pB = pitchHeight - padding
  const pW = pR - pL
  const pH = pB - pT
  const cx = displayWidth / 2
  const midY = pitchHeight / 2

  // Blue/green turf — flat, no stripes (hockey uses water-based turf)
  const turfGrad = ctx.createRadialGradient(cx, midY, 0, cx, midY, displayWidth * 0.7)
  turfGrad.addColorStop(0, '#1a7a6a')
  turfGrad.addColorStop(1, '#156858')
  ctx.fillStyle = turfGrad
  ctx.fillRect(pL, pT, pW, pH)

  // Boundary
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.strokeRect(pL, pT, pW, pH)

  // Centre line
  ctx.beginPath()
  ctx.moveTo(pL, midY)
  ctx.lineTo(pR, midY)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Centre spot
  ctx.beginPath()
  ctx.arc(cx, midY, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fill()

  // 25-yard lines (approx 27% from each end)
  const line25T = pT + pH * 0.27
  const line25B = pB - pH * 0.27
  ctx.setLineDash([8, 4])
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(pL, line25T)
  ctx.lineTo(pR, line25T)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(pL, line25B)
  ctx.lineTo(pR, line25B)
  ctx.stroke()
  ctx.setLineDash([])

  // D-circles (shooting circles) — flattened arcs at each end
  const dRadius = pW * 0.3
  const dCenterOffset = pH * 0.02

  // Top D
  ctx.beginPath()
  ctx.arc(cx, pT - dCenterOffset, dRadius, 0.2, Math.PI - 0.2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.stroke()
  // Fill D area with subtle colour
  ctx.beginPath()
  ctx.arc(cx, pT - dCenterOffset, dRadius, 0.2, Math.PI - 0.2)
  ctx.lineTo(pL, pT)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.fill()

  // Bottom D
  ctx.beginPath()
  ctx.arc(cx, pB + dCenterOffset, dRadius, Math.PI + 0.2, Math.PI * 2 - 0.2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, pB + dCenterOffset, dRadius, Math.PI + 0.2, Math.PI * 2 - 0.2)
  ctx.lineTo(pR, pB)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.fill()

  // Penalty spots (top and bottom)
  const penSpotOffset = pH * 0.08
  ctx.beginPath()
  ctx.arc(cx, pT + penSpotOffset, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, pB - penSpotOffset, 3, 0, Math.PI * 2)
  ctx.fill()

  // Goal backboards (thin lines at each end)
  const goalW = pW * 0.12
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - goalW / 2, pT)
  ctx.lineTo(cx + goalW / 2, pT)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - goalW / 2, pB)
  ctx.lineTo(cx + goalW / 2, pB)
  ctx.stroke()
}

// ─── AMERICAN FOOTBALL ──────────────────────────────────────────────────────

function renderAmericanFootballField({ ctx, displayWidth, pitchHeight, padding }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#1a3a14'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  const pL = padding
  const pR = displayWidth - padding
  const pT = padding
  const pB = pitchHeight - padding
  const pW = pR - pL
  const pH = pB - pT
  const cx = displayWidth / 2

  // Grass base
  const pitchGrad = ctx.createRadialGradient(cx, pitchHeight / 2, 0, cx, pitchHeight / 2, displayWidth * 0.7)
  pitchGrad.addColorStop(0, '#3a8c32')
  pitchGrad.addColorStop(1, '#2a6e20')
  ctx.fillStyle = pitchGrad
  ctx.fillRect(pL, pT, pW, pH)

  // End zones
  const endZoneH = pH * 0.083 // ~1/12 of field
  ctx.fillStyle = 'rgba(30, 60, 160, 0.18)'
  ctx.fillRect(pL, pT, pW, endZoneH)
  ctx.fillStyle = 'rgba(160, 30, 30, 0.18)'
  ctx.fillRect(pL, pB - endZoneH, pW, endZoneH)

  // Boundary
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.strokeRect(pL, pT, pW, pH)

  // End zone lines (goal lines)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(pL, pT + endZoneH)
  ctx.lineTo(pR, pT + endZoneH)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(pL, pB - endZoneH)
  ctx.lineTo(pR, pB - endZoneH)
  ctx.stroke()

  // Yard lines — 10 yard lines between goal lines
  const fieldH = pH - endZoneH * 2
  const yardLineSpacing = fieldH / 10
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 1.5

  const yardNumbers = [10, 20, 30, 40, 50, 40, 30, 20, 10]
  const fontSize = Math.max(9, pW * 0.028)
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'

  for (let i = 1; i <= 9; i++) {
    const y = pT + endZoneH + i * yardLineSpacing
    ctx.beginPath()
    ctx.moveTo(pL, y)
    ctx.lineTo(pR, y)
    ctx.stroke()

    // Yard numbers on left and right
    ctx.textAlign = 'left'
    ctx.fillText(String(yardNumbers[i - 1]), pL + pW * 0.06, y)
    ctx.textAlign = 'right'
    ctx.fillText(String(yardNumbers[i - 1]), pR - pW * 0.06, y)
  }

  // Hash marks (small ticks between yard lines)
  const hashInset = pW * 0.35
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i++) {
    for (let j = 1; j < 5; j++) {
      const y = pT + endZoneH + i * yardLineSpacing + j * (yardLineSpacing / 5)
      if (y >= pB - endZoneH) break
      // Left hash
      ctx.beginPath()
      ctx.moveTo(cx - hashInset, y)
      ctx.lineTo(cx - hashInset + 4, y)
      ctx.stroke()
      // Right hash
      ctx.beginPath()
      ctx.moveTo(cx + hashInset - 4, y)
      ctx.lineTo(cx + hashInset, y)
      ctx.stroke()
    }
  }

  // Goalposts (Y-shape at each end)
  const postW = pW * 0.08
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2.5
  // Top goalpost
  ctx.beginPath()
  ctx.moveTo(cx, pT)
  ctx.lineTo(cx, pT + endZoneH * 0.4)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - postW / 2, pT)
  ctx.lineTo(cx + postW / 2, pT)
  ctx.stroke()
  // Bottom goalpost
  ctx.beginPath()
  ctx.moveTo(cx, pB)
  ctx.lineTo(cx, pB - endZoneH * 0.4)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - postW / 2, pB)
  ctx.lineTo(cx + postW / 2, pB)
  ctx.stroke()

  // End zone labels
  ctx.font = `bold ${Math.max(10, pW * 0.03)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.fillText('END ZONE', cx, pT + endZoneH / 2)
  ctx.fillText('END ZONE', cx, pB - endZoneH / 2)
}

// ─── TENNIS ─────────────────────────────────────────────────────────────────

function renderTennisCourt({ ctx, displayWidth, pitchHeight, padding }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#0a2010'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  const pL = padding
  const pR = displayWidth - padding
  const pT = padding
  const pB = pitchHeight - padding
  const pW = pR - pL
  const pH = pB - pT
  const cx = displayWidth / 2
  const midY = pitchHeight / 2

  // Court surface — blue hard court
  ctx.fillStyle = '#2868a0'
  ctx.fillRect(pL, pT, pW, pH)

  // Subtle gradient for depth
  const courtGrad = ctx.createRadialGradient(cx, midY, 0, cx, midY, displayWidth * 0.6)
  courtGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)')
  courtGrad.addColorStop(1, 'rgba(0, 0, 0, 0.08)')
  ctx.fillStyle = courtGrad
  ctx.fillRect(pL, pT, pW, pH)

  // Doubles tramlines
  const tramW = pW * 0.13
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2
  ctx.setLineDash([])

  // Outer boundary (doubles court)
  ctx.strokeRect(pL, pT, pW, pH)

  // Singles sidelines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pL + tramW, pT)
  ctx.lineTo(pL + tramW, pB)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(pR - tramW, pT)
  ctx.lineTo(pR - tramW, pB)
  ctx.stroke()

  // Net line (center)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pL - 4, midY)
  ctx.lineTo(pR + 4, midY)
  ctx.stroke()

  // Net posts (small squares at ends)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillRect(pL - 4, midY - 3, 6, 6)
  ctx.fillRect(pR - 2, midY - 3, 6, 6)

  // Service boxes
  const serviceLineOffset = pH * 0.21
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2

  // Top service line
  ctx.beginPath()
  ctx.moveTo(pL + tramW, pT + serviceLineOffset)
  ctx.lineTo(pR - tramW, pT + serviceLineOffset)
  ctx.stroke()

  // Bottom service line
  ctx.beginPath()
  ctx.moveTo(pL + tramW, pB - serviceLineOffset)
  ctx.lineTo(pR - tramW, pB - serviceLineOffset)
  ctx.stroke()

  // Center service lines
  ctx.beginPath()
  ctx.moveTo(cx, pT + serviceLineOffset)
  ctx.lineTo(cx, midY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, midY)
  ctx.lineTo(cx, pB - serviceLineOffset)
  ctx.stroke()

  // Center marks on baselines
  const centerMarkLen = pH * 0.02
  ctx.beginPath()
  ctx.moveTo(cx, pT)
  ctx.lineTo(cx, pT + centerMarkLen)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, pB)
  ctx.lineTo(cx, pB - centerMarkLen)
  ctx.stroke()
}

// ─── VOLLEYBALL ─────────────────────────────────────────────────────────────

function renderVolleyballCourt({ ctx, displayWidth, pitchHeight, padding }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#1a1008'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  const pL = padding
  const pR = displayWidth - padding
  const pT = padding
  const pB = pitchHeight - padding
  const pW = pR - pL
  const pH = pB - pT
  const cx = displayWidth / 2
  const midY = pitchHeight / 2

  // Wood floor
  const floorGrad = ctx.createLinearGradient(pL, pT, pR, pB)
  floorGrad.addColorStop(0, '#c4883a')
  floorGrad.addColorStop(0.5, '#d4984a')
  floorGrad.addColorStop(1, '#b47830')
  ctx.fillStyle = floorGrad
  ctx.fillRect(pL, pT, pW, pH)

  // Subtle wood grain
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
  ctx.lineWidth = 1
  const grainSpacing = pW / 16
  for (let i = 1; i < 16; i++) {
    ctx.beginPath()
    ctx.moveTo(pL + i * grainSpacing, pT)
    ctx.lineTo(pL + i * grainSpacing, pB)
    ctx.stroke()
  }

  // Court boundary
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.strokeRect(pL, pT, pW, pH)

  // Net line (centre)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pL - 4, midY)
  ctx.lineTo(pR + 4, midY)
  ctx.stroke()

  // Net posts
  ctx.fillStyle = 'rgba(200, 200, 200, 0.6)'
  ctx.fillRect(pL - 5, midY - 3, 6, 6)
  ctx.fillRect(pR - 1, midY - 3, 6, 6)

  // Attack lines (3m from net — approx 33% from center)
  const attackOffset = pH * 0.167
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pL, midY - attackOffset)
  ctx.lineTo(pR, midY - attackOffset)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(pL, midY + attackOffset)
  ctx.lineTo(pR, midY + attackOffset)
  ctx.stroke()

  // Zone position markers (rotation positions 1-6)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  const zoneFont = Math.max(14, pW * 0.05)
  ctx.font = `bold ${zoneFont}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Top half zones (positions 2, 3, 4 front row; 1, 6, 5 back row)
  const topFrontY = midY - attackOffset / 2
  const topBackY = pT + (midY - attackOffset - pT) / 2
  ctx.fillText('4', pL + pW * 0.2, topFrontY)
  ctx.fillText('3', cx, topFrontY)
  ctx.fillText('2', pR - pW * 0.2, topFrontY)
  ctx.fillText('5', pL + pW * 0.2, topBackY)
  ctx.fillText('6', cx, topBackY)
  ctx.fillText('1', pR - pW * 0.2, topBackY)

  // Bottom half zones (mirrored)
  const botFrontY = midY + attackOffset / 2
  const botBackY = pB - (pB - midY - attackOffset) / 2
  ctx.fillText('2', pL + pW * 0.2, botFrontY)
  ctx.fillText('3', cx, botFrontY)
  ctx.fillText('4', pR - pW * 0.2, botFrontY)
  ctx.fillText('1', pL + pW * 0.2, botBackY)
  ctx.fillText('6', cx, botBackY)
  ctx.fillText('5', pR - pW * 0.2, botBackY)
}

// ─── CRICKET ────────────────────────────────────────────────────────────────

function renderCricketGround({ ctx, displayWidth, pitchHeight, padding }: SurfaceContext) {
  // Dark surround
  ctx.fillStyle = '#1a3a14'
  ctx.fillRect(0, 0, displayWidth, pitchHeight)

  const cx = displayWidth / 2
  const cy = pitchHeight / 2
  const innerW = displayWidth - padding * 2
  const innerH = pitchHeight - padding * 2
  const radiusX = innerW / 2
  const radiusY = innerH / 2

  // Oval grass field
  const grassGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radiusX, radiusY))
  grassGrad.addColorStop(0, '#3a8c32')
  grassGrad.addColorStop(0.7, '#348528')
  grassGrad.addColorStop(1, '#2a6e20')
  ctx.fillStyle = grassGrad

  ctx.beginPath()
  ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fill()

  // Oval boundary line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.stroke()

  // 30-yard circle (inner ring — approx 55% of boundary)
  const inner30X = radiusX * 0.55
  const inner30Y = radiusY * 0.55
  ctx.setLineDash([8, 5])
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(cx, cy, inner30X, inner30Y, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Pitch strip (brown rectangle in centre)
  const pitchStripW = innerW * 0.05
  const pitchStripH = innerH * 0.22
  ctx.fillStyle = '#a08050'
  ctx.fillRect(cx - pitchStripW / 2, cy - pitchStripH / 2, pitchStripW, pitchStripH)

  // Pitch outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(cx - pitchStripW / 2, cy - pitchStripH / 2, pitchStripW, pitchStripH)

  // Crease lines
  const creaseW = pitchStripW * 2
  const creaseOffset = pitchStripH * 0.42
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2

  // Bowling crease (top)
  ctx.beginPath()
  ctx.moveTo(cx - creaseW / 2, cy - creaseOffset)
  ctx.lineTo(cx + creaseW / 2, cy - creaseOffset)
  ctx.stroke()
  // Popping crease (top)
  ctx.beginPath()
  ctx.moveTo(cx - creaseW / 2, cy - creaseOffset - pitchStripH * 0.06)
  ctx.lineTo(cx + creaseW / 2, cy - creaseOffset - pitchStripH * 0.06)
  ctx.stroke()

  // Bowling crease (bottom)
  ctx.beginPath()
  ctx.moveTo(cx - creaseW / 2, cy + creaseOffset)
  ctx.lineTo(cx + creaseW / 2, cy + creaseOffset)
  ctx.stroke()
  // Popping crease (bottom)
  ctx.beginPath()
  ctx.moveTo(cx - creaseW / 2, cy + creaseOffset + pitchStripH * 0.06)
  ctx.lineTo(cx + creaseW / 2, cy + creaseOffset + pitchStripH * 0.06)
  ctx.stroke()

  // Return creases (short vertical lines at ends of bowling crease)
  const returnCreaseLen = pitchStripH * 0.1
  // Top end
  ctx.beginPath()
  ctx.moveTo(cx - creaseW / 2, cy - creaseOffset)
  ctx.lineTo(cx - creaseW / 2, cy - creaseOffset - returnCreaseLen)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + creaseW / 2, cy - creaseOffset)
  ctx.lineTo(cx + creaseW / 2, cy - creaseOffset - returnCreaseLen)
  ctx.stroke()
  // Bottom end
  ctx.beginPath()
  ctx.moveTo(cx - creaseW / 2, cy + creaseOffset)
  ctx.lineTo(cx - creaseW / 2, cy + creaseOffset + returnCreaseLen)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + creaseW / 2, cy + creaseOffset)
  ctx.lineTo(cx + creaseW / 2, cy + creaseOffset + returnCreaseLen)
  ctx.stroke()

  // Stumps (3 vertical lines at each end)
  const stumpSpacing = pitchStripW * 0.2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 2
  const stumpLen = pitchStripH * 0.04
  for (let i = -1; i <= 1; i++) {
    // Top stumps
    ctx.beginPath()
    ctx.moveTo(cx + i * stumpSpacing, cy - creaseOffset)
    ctx.lineTo(cx + i * stumpSpacing, cy - creaseOffset + stumpLen)
    ctx.stroke()
    // Bottom stumps
    ctx.beginPath()
    ctx.moveTo(cx + i * stumpSpacing, cy + creaseOffset)
    ctx.lineTo(cx + i * stumpSpacing, cy + creaseOffset - stumpLen)
    ctx.stroke()
  }
}
