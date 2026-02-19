"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface Metrics {
  users: {
    total: number
    pro: number
    today: number
    week: number
  }
  reflections: {
    total: number
    today: number
    week: number
  }
  conversations: {
    total: number
  }
  feedback: {
    satisfactionRate: number | null
    total: number
  }
  emails: {
    sentThisMonth: number
  }
  recentSignups: Array<{
    id: string
    email: string | null
    display_name: string | null
    subscription_tier: string
    created_at: string
  }>
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [promoPreview, setPromoPreview] = useState<{
    total_free_users: number
    already_received: number
    will_receive: number
    recipients: Array<{ email: string; name: string | null }>
  } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoSending, setPromoSending] = useState(false)
  const [promoResult, setPromoResult] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/metrics")
      if (!res.ok) {
        throw new Error("Failed to fetch metrics")
      }
      const data = await res.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    setSendingTestEmail(true)
    setTestEmailStatus(null)
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "admin@360tft.com",
          subject: "Test Email from CoachReflection Admin",
          message: "This is a test email to verify the email system is working correctly."
        })
      })
      const data = await res.json()
      if (res.ok) {
        setTestEmailStatus(`Email sent successfully to ${data.sentTo}`)
      } else {
        setTestEmailStatus(`Error: ${data.error}${data.details ? ` - ${JSON.stringify(data.details)}` : ""}`)
      }
    } catch (err) {
      setTestEmailStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSendingTestEmail(false)
    }
  }

  const previewPromo = async () => {
    setPromoLoading(true)
    setPromoResult(null)
    try {
      const res = await fetch("/api/admin/promo")
      if (!res.ok) throw new Error("Failed to fetch promo preview")
      const data = await res.json()
      setPromoPreview(data)
    } catch (err) {
      setPromoResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setPromoLoading(false)
    }
  }

  const sendPromo = async () => {
    if (!confirm(`Send promo email to ${promoPreview?.will_receive} free users? This cannot be undone.`)) return
    setPromoSending(true)
    setPromoResult(null)
    try {
      const res = await fetch("/api/admin/promo", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setPromoResult(`Sent: ${data.sent}, Failed: ${data.failed}, Skipped: ${data.skipped}${data.errors ? ` | Errors: ${data.errors.join(", ")}` : ""}`)
        setPromoPreview(null)
      } else {
        setPromoResult(`Error: ${data.error}`)
      }
    } catch (err) {
      setPromoResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setPromoSending(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard Overview</h1>
        <p className="text-muted-foreground">Loading metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard Overview</h1>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchMetrics} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics) return null

  const conversionRate = metrics.users.total > 0
    ? ((metrics.users.pro / metrics.users.total) * 100).toFixed(1)
    : "0"

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard Overview</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-4xl">{metrics.users.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              +{metrics.users.today} today, +{metrics.users.week} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pro Users</CardDescription>
            <CardTitle className="text-4xl text-green-600">{metrics.users.pro}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reflections</CardDescription>
            <CardTitle className="text-4xl">{metrics.reflections.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              +{metrics.reflections.today} today, +{metrics.reflections.week} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversations</CardDescription>
            <CardTitle className="text-4xl">{metrics.conversations.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Chat sessions started
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Satisfaction</CardDescription>
            <CardTitle className="text-3xl">
              {metrics.feedback.satisfactionRate !== null
                ? `${metrics.feedback.satisfactionRate}%`
                : "N/A"
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Based on {metrics.feedback.total} feedback responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Emails Sent</CardDescription>
            <CardTitle className="text-3xl">{metrics.emails.sentThisMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This month (successful)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Est. MRR</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ${(metrics.users.pro * 7.99).toFixed(0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              At $7.99/user (avg)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
          <CardDescription>Last 10 users</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentSignups.length === 0 ? (
            <p className="text-muted-foreground">No signups yet</p>
          ) : (
            <div className="space-y-4">
              {metrics.recentSignups.map((signup) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {signup.display_name || signup.email || "Unknown"}
                    </p>
                    {signup.display_name && signup.email && (
                      <p className="text-xs text-muted-foreground">{signup.email}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {new Date(signup.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    signup.subscription_tier === "free"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {signup.subscription_tier}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promo Email */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>50% Off Annual Promo</CardTitle>
          <CardDescription>Send the half-price annual promo email to all free users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={previewPromo}
              disabled={promoLoading}
              variant="outline"
            >
              {promoLoading ? "Loading..." : "Preview Recipients"}
            </Button>
            {promoPreview && promoPreview.will_receive > 0 && (
              <Button
                onClick={sendPromo}
                disabled={promoSending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {promoSending ? "Sending..." : `Send to ${promoPreview.will_receive} users`}
              </Button>
            )}
          </div>

          {promoPreview && (
            <div className="mt-4 space-y-2">
              <div className="flex gap-6 text-sm">
                <span>Total free users: <strong>{promoPreview.total_free_users}</strong></span>
                <span>Already received: <strong>{promoPreview.already_received}</strong></span>
                <span>Will receive: <strong>{promoPreview.will_receive}</strong></span>
              </div>
              {promoPreview.recipients.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto bg-muted rounded-lg p-3">
                  {promoPreview.recipients.map((r, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {r.email} {r.name ? `(${r.name})` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {promoResult && (
            <p className={`mt-4 text-sm ${promoResult.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
              {promoResult}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Email System</CardTitle>
          <CardDescription>Send a test email to verify Resend is configured correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={sendTestEmail}
              disabled={sendingTestEmail}
            >
              {sendingTestEmail ? "Sending..." : "Send Test Email to admin@360tft.com"}
            </Button>
          </div>
          {testEmailStatus && (
            <p className={`mt-4 text-sm ${testEmailStatus.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
              {testEmailStatus}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
