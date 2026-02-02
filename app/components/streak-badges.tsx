"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"

interface StreakData {
  current_streak: number
  longest_streak: number
  total_active_days: number
}

interface UserBadgeData {
  id: string
  earned_at: string
  badge: {
    id: string
    name: string
    description: string
    emoji: string
    category: string
    rarity: string
  }
}

export function StreakBadges() {
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [badges, setBadges] = useState<UserBadgeData[]>([])
  const [newBadges, setNewBadges] = useState<UserBadgeData["badge"][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/gamification")
      if (res.ok) {
        const data = await res.json()
        setStreak(data.streak)
        setBadges((data.userBadges || []).filter((ub: UserBadgeData) => ub.badge))
        setNewBadges((data.newBadges || []).filter(Boolean))
      }
    } catch (err) {
      console.error("Failed to fetch gamification data:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-16 w-16 bg-muted rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStreak = streak?.current_streak ?? 0
  const streakLabel = currentStreak === 0 ? "Starting"
    : currentStreak >= 30 ? "On Fire"
    : currentStreak >= 7 ? "Building"
    : "Beginning"

  return (
    <div className="space-y-4">
      {/* New Badge Toast */}
      {newBadges.length > 0 && (
        <Card className="border-primary bg-muted/50 dark:bg-background">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-primary dark:text-primary">
                  New Badge{newBadges.length > 1 ? "s" : ""} Earned!
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {newBadges.map(badge => (
                    <Badge key={badge.id} variant="secondary" className="bg-primary/20 dark:bg-primary/80">
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streak Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            Your Streak
          </CardTitle>
          <CardDescription>Keep reflecting to build your streak ({streakLabel})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{streak?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{streak?.longest_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Longest</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{streak?.total_active_days || 0}</p>
              <p className="text-xs text-muted-foreground">Total Days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Card */}
      {badges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Badges</CardTitle>
            <CardDescription>{badges.length} badge{badges.length === 1 ? "" : "s"} earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map(ub => (
                <div
                  key={ub.id}
                  className={`
                    px-3 py-2 rounded-lg text-center
                    ${ub.badge.rarity === "legendary" ? "bg-primary/10 dark:bg-primary/10 border-2 border-primary" : ""}
                    ${ub.badge.rarity === "rare" ? "bg-purple-100 dark:bg-purple-900" : ""}
                    ${ub.badge.rarity === "uncommon" ? "bg-blue-100 dark:bg-blue-900" : ""}
                    ${ub.badge.rarity === "common" ? "bg-muted" : ""}
                  `}
                  title={ub.badge.description}
                >
                  <p className="text-xs font-medium">{ub.badge.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
