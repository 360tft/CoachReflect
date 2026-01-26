"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface InactiveUser {
  id: string
  email: string
  display_name: string | null
  subscription_tier: string
  created_at: string
  last_active_at: string | null
  days_inactive: number
  total_messages: number
  total_reflections: number
  last_email_sent: string | null
}

export default function EngagementPage() {
  const [users, setUsers] = useState<InactiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [inactiveDays, setInactiveDays] = useState(7)
  const [tierFilter, setTierFilter] = useState<string>("all")

  useEffect(() => {
    fetchUsers()
  }, [inactiveDays, tierFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        days: inactiveDays.toString(),
        tier: tierFilter,
      })
      const response = await fetch(`/api/admin/engagement?${params}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to fetch data")
        return
      }

      setUsers(data.users || [])
      setError(null)
    } catch {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const sendReEngagementEmail = async (user: InactiveUser) => {
    setSending(user.id)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/admin/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          displayName: user.display_name,
          daysInactive: user.days_inactive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send email")
        return
      }

      setSuccessMessage(`Re-engagement email sent to ${user.email}`)
      fetchUsers()
    } catch {
      setError("Failed to send email")
    } finally {
      setSending(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Re-engagement</h1>
          <p className="text-muted-foreground">
            Find inactive users and send re-engagement emails
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Inactive for at least:</label>
              <select
                value={inactiveDays}
                onChange={(e) => setInactiveDays(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg bg-background"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subscription:</label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-background"
              >
                <option value="all">All</option>
                <option value="free">Free only</option>
                <option value="pro">Pro only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-300">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Inactive Users</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${users.length} users match your criteria`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No inactive users found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{user.email}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        user.subscription_tier === "pro"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}>
                        {user.subscription_tier}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>
                        Inactive for <span className="font-medium text-orange-600">{user.days_inactive} days</span>
                        {" "}• Joined {formatDate(user.created_at)}
                      </p>
                      <p>
                        {user.total_messages} messages • {user.total_reflections} reflections
                      </p>
                      {user.last_email_sent && (
                        <p className="text-amber-600 dark:text-amber-400">
                          Last email sent {formatDate(user.last_email_sent)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => sendReEngagementEmail(user)}
                    disabled={sending === user.id}
                    size="sm"
                  >
                    {sending === user.id ? "Sending..." : user.last_email_sent ? "Resend" : "Send Email"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Template Preview</CardTitle>
          <CardDescription>
            This is the generic re-engagement email that will be sent (no personal reflection data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p><strong>Subject:</strong> We miss you at Coach Reflection</p>
            <hr className="my-2" />
            <p>Hi [Name],</p>
            <p>It&apos;s been a while since you last reflected on your coaching sessions.</p>
            <p>Taking just 2 minutes after each session to reflect can transform how you grow as a coach. Your insights build up over time, revealing patterns you&apos;d never notice otherwise.</p>
            <p>Ready to get back to it?</p>
            <p>[Button: Start Reflecting]</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
