"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { SportSelector, SPORTS } from "@/app/components/sport-selector"

const AGE_GROUPS = [
  { id: "u6-u8", label: "Under 6-8" },
  { id: "u9-u11", label: "Under 9-11" },
  { id: "u12-u14", label: "Under 12-14" },
  { id: "u15-u18", label: "Under 15-18" },
  { id: "adult", label: "Adult / Senior" },
  { id: "mixed", label: "Mixed Ages" },
]

export function OnboardingProfile() {
  const [sport, setSport] = useState<string>("")
  const [ageGroup, setAgeGroup] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!sport) return
    setSaving(true)
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport, age_group: ageGroup || null }),
      })
      setDone(true)
      router.refresh()
    } catch {
      // Silent fail - they can still proceed
      setDone(true)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    const selectedSport = SPORTS.find(s => s.id === sport)
    return (
      <div className="text-center py-2">
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          {selectedSport?.icon} Profile set. The AI will tailor advice to your coaching.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">What sport do you coach?</p>
        <SportSelector value={sport} onChange={setSport} variant="dropdown" />
      </div>

      {sport && (
        <div>
          <p className="text-sm font-medium mb-2">What age group?</p>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((ag) => (
              <button
                key={ag.id}
                onClick={() => setAgeGroup(ag.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  ageGroup === ag.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border text-foreground hover:border-primary/50"
                }`}
              >
                {ag.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {sport && (
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          variant="outline"
          className="w-full"
        >
          {saving ? "Saving..." : "Save and continue"}
        </Button>
      )}
    </div>
  )
}
