"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface ReminderSchedule {
  id: string
  reminder_type: string
  enabled: boolean
  days_of_week: number[]
  time_of_day: string
  timezone: string
}

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]

const TIMEZONES = [
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
]

export function ReminderSettings() {
  const [reminder, setReminder] = useState<ReminderSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5]) // Mon-Fri
  const [timeOfDay, setTimeOfDay] = useState("19:00")
  const [timezone, setTimezone] = useState("Europe/London")

  useEffect(() => {
    async function fetchReminders() {
      try {
        const res = await fetch("/api/reminders")
        if (!res.ok) throw new Error("Failed to fetch")

        const data = await res.json()
        const dailyReminder = data.reminders.find(
          (r: ReminderSchedule) => r.reminder_type === "daily"
        )

        if (dailyReminder) {
          setReminder(dailyReminder)
          setEnabled(dailyReminder.enabled)
          setDaysOfWeek(dailyReminder.days_of_week || [1, 2, 3, 4, 5])
          setTimeOfDay(dailyReminder.time_of_day?.substring(0, 5) || "19:00")
          setTimezone(dailyReminder.timezone || "Europe/London")
        }
      } catch {
        console.error("Failed to fetch reminders")
      } finally {
        setLoading(false)
      }
    }

    fetchReminders()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_type: "daily",
          enabled,
          days_of_week: daysOfWeek,
          time_of_day: `${timeOfDay}:00`,
          timezone,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      const data = await res.json()
      setReminder(data.reminder)
    } catch {
      alert("Failed to save reminder settings")
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day))
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort())
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-24 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reflection Reminders</CardTitle>
        <CardDescription>
          Get a gentle nudge to reflect after your sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Daily Reminder</p>
            <p className="text-sm text-muted-foreground">
              Receive a notification to reflect on your day
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-brand' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <>
            {/* Days selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Days</label>
              <div className="flex gap-1">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      daysOfWeek.includes(day.value)
                        ? 'bg-brand text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Time</label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                When should we remind you?
              </p>
            </div>

            {/* Timezone selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-hover"
        >
          {saving ? "Saving..." : "Save Reminder Settings"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Make sure push notifications are enabled in your browser and on your device.
        </p>
      </CardContent>
    </Card>
  )
}
