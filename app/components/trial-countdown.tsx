"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface TrialCountdownProps {
  trialStartDate: string // ISO date string (profile updated_at when trial started)
}

export function TrialCountdown({ trialStartDate }: TrialCountdownProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const start = new Date(trialStartDate)
    const trialEnd = new Date(start)
    trialEnd.setDate(trialEnd.getDate() + 7)

    const now = new Date()
    const diffMs = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    setDaysLeft(Math.max(0, diffDays))
  }, [trialStartDate])

  if (daysLeft === null || daysLeft > 7) return null

  return (
    <div className="rounded-lg px-4 py-3 border border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">
            {daysLeft === 0
              ? "Your Pro trial ends today"
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left on your Pro trial`
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {daysLeft <= 2
              ? "Keep your unlimited reflections, voice notes, and coaching insights."
              : "You have full Pro access. Make the most of it."
            }
          </p>
        </div>
        {daysLeft <= 3 && (
          <Link
            href="/dashboard/settings"
            className="text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
          >
            View subscription
          </Link>
        )}
      </div>
    </div>
  )
}
