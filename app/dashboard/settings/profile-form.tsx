"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { SportSelector, SPORTS } from "@/app/components/sport-selector"

interface ProfileFormProps {
  profile: {
    display_name: string | null
    club_name: string | null
    age_group: string | null
    coaching_level: string | null
    sport: string | null
  }
  email: string
}

const COACHING_LEVELS = [
  { value: "", label: "Select level..." },
  { value: "grassroots", label: "Grassroots" },
  { value: "academy", label: "Academy" },
  { value: "semi-pro", label: "Semi-Pro" },
  { value: "professional", label: "Professional" },
]

const AGE_GROUPS = [
  { value: "", label: "Select age group..." },
  { value: "U6-U8", label: "U6-U8" },
  { value: "U9-U10", label: "U9-U10" },
  { value: "U11-U12", label: "U11-U12" },
  { value: "U13-U14", label: "U13-U14" },
  { value: "U15-U16", label: "U15-U16" },
  { value: "U17-U18", label: "U17-U18" },
  { value: "U19-U21", label: "U19-U21" },
  { value: "Senior", label: "Senior" },
  { value: "Multiple", label: "Multiple age groups" },
]

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "")
  const [clubName, setClubName] = useState(profile.club_name || "")
  const [ageGroup, setAgeGroup] = useState(profile.age_group || "")
  const [coachingLevel, setCoachingLevel] = useState(profile.coaching_level || "")
  const [sport, setSport] = useState(profile.sport || "football")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          club_name: clubName,
          age_group: ageGroup,
          coaching_level: coachingLevel,
          sport: sport,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update profile")
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your coaching profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          {saved && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 rounded-lg">
              Profile updated successfully!
            </div>
          )}

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="Coach Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <p className="text-muted-foreground px-3 py-2 bg-muted rounded-lg">{email}</p>
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Sport
            </label>
            <SportSelector
              value={sport}
              onChange={setSport}
              disabled={saving}
              variant="dropdown"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This helps tailor your coaching reflection experience
            </p>
          </div>

          <div>
            <label htmlFor="clubName" className="block text-sm font-medium mb-2">
              Club / Team
            </label>
            <input
              id="clubName"
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="Riverside FC"
            />
          </div>

          <div>
            <label htmlFor="ageGroup" className="block text-sm font-medium mb-2">
              Age Group
            </label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {AGE_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="coachingLevel" className="block text-sm font-medium mb-2">
              Coaching Level
            </label>
            <select
              id="coachingLevel"
              value={coachingLevel}
              onChange={(e) => setCoachingLevel(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {COACHING_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
