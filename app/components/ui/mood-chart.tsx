"use client"

import { MOOD_OPTIONS } from "@/app/types"

interface MoodChartProps {
  data: Array<{
    date: string
    mood_rating: number
    energy_rating: number
  }>
}

export function MoodChart({ data }: MoodChartProps) {
  if (data.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Complete at least 2 reflections to see your trend</p>
      </div>
    )
  }

  // Take last 10 entries, reverse to show oldest first
  const chartData = data.slice(0, 10).reverse()
  const width = 100
  const height = 50
  const padding = 5

  // Calculate points for mood line
  const moodPoints = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * (width - padding * 2)
    const y = height - padding - ((d.mood_rating - 1) / 4) * (height - padding * 2)
    return `${x},${y}`
  }).join(" ")

  // Calculate points for energy line
  const energyPoints = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * (width - padding * 2)
    const y = height - padding - ((d.energy_rating - 1) / 4) * (height - padding * 2)
    return `${x},${y}`
  }).join(" ")

  // Get current mood/energy
  const latestMood = data[0]?.mood_rating || 3
  const latestEnergy = data[0]?.energy_rating || 3
  const moodLabel = MOOD_OPTIONS.find(m => m.value === latestMood)?.label || "Neutral"

  // Calculate trend (comparing first half to second half average)
  const halfIndex = Math.floor(chartData.length / 2)
  const firstHalfAvg = chartData.slice(0, halfIndex).reduce((acc, d) => acc + d.mood_rating, 0) / halfIndex
  const secondHalfAvg = chartData.slice(halfIndex).reduce((acc, d) => acc + d.mood_rating, 0) / (chartData.length - halfIndex)
  const trend = secondHalfAvg - firstHalfAvg

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm font-medium">Current Mood: {moodLabel}</p>
            <p className="text-xs text-muted-foreground">Energy: {latestEnergy}/5</p>
          </div>
        </div>
        <div className="text-right">
          {trend > 0.3 && (
            <span className="text-green-600 text-sm font-medium">↑ Improving</span>
          )}
          {trend < -0.3 && (
            <span className="text-primary text-sm font-medium">↓ Declining</span>
          )}
          {trend >= -0.3 && trend <= 0.3 && (
            <span className="text-muted-foreground text-sm">→ Steady</span>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map((level) => {
          const y = height - padding - ((level - 1) / 4) * (height - padding * 2)
          return (
            <line
              key={level}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            />
          )
        })}

        {/* Energy line (dashed, lighter) */}
        <polyline
          points={energyPoints}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeWidth={1}
          strokeDasharray="2,2"
        />

        {/* Mood line */}
        <polyline
          points={moodPoints}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Mood points */}
        {chartData.map((d, i) => {
          const x = padding + (i / (chartData.length - 1)) * (width - padding * 2)
          const y = height - padding - ((d.mood_rating - 1) / 4) * (height - padding * 2)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2}
              fill="hsl(var(--primary))"
            />
          )
        })}
      </svg>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{chartData.length} sessions ago</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-primary rounded"></span>
            Mood
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 border-t border-dashed border-current"></span>
            Energy
          </span>
        </div>
        <span>Latest</span>
      </div>
    </div>
  )
}
