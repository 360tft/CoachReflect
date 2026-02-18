"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

interface EmailPreferencesProps {
  weeklySummaryEnabled: boolean
  emailNotificationsEnabled: boolean
}

export function EmailPreferences({
  weeklySummaryEnabled: initialWeeklySummary,
  emailNotificationsEnabled: initialEmailNotifications,
}: EmailPreferencesProps) {
  const [weeklySummary, setWeeklySummary] = useState(initialWeeklySummary)
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications)
  const [saving, setSaving] = useState(false)

  const handleToggle = async (field: 'weekly_summary_enabled' | 'email_notifications_enabled', value: boolean) => {
    setSaving(true)

    try {
      const res = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!res.ok) {
        throw new Error("Failed to update preference")
      }

      if (field === 'weekly_summary_enabled') {
        setWeeklySummary(value)
      } else {
        setEmailNotifications(value)
      }
    } catch {
      // Revert on error
      if (field === 'weekly_summary_enabled') {
        setWeeklySummary(!value)
      } else {
        setEmailNotifications(!value)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>
          Manage what emails you receive from CoachReflection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium">Weekly Summary</p>
            <p className="text-sm text-muted-foreground">
              Receive a weekly summary of your coaching reflections every Monday
            </p>
          </div>
          <button
            onClick={() => handleToggle('weekly_summary_enabled', !weeklySummary)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              weeklySummary ? 'bg-brand' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                weeklySummary ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive tips, feature updates, and onboarding emails
            </p>
          </div>
          <button
            onClick={() => handleToggle('email_notifications_enabled', !emailNotifications)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailNotifications ? 'bg-brand' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
