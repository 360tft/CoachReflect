"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface AbandonedCheckout {
  id: string
  email: string
  display_name: string | null
  stripe_customer_id: string | null
  created_at: string
  hours_ago: number
  recovery_sent_at: string | null
}

export default function RecoveryPage() {
  const [checkouts, setCheckouts] = useState<AbandonedCheckout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchCheckouts()
  }, [])

  const fetchCheckouts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/recovery")
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to fetch data")
        return
      }

      setCheckouts(data.checkouts || [])
      setError(null)
    } catch {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const sendRecoveryEmail = async (checkout: AbandonedCheckout) => {
    setSending(checkout.id)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/admin/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: checkout.id,
          email: checkout.email,
          displayName: checkout.display_name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send email")
        return
      }

      setSuccessMessage(`Recovery email sent to ${checkout.email}`)
      fetchCheckouts()
    } catch {
      setError("Failed to send email")
    } finally {
      setSending(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checkout Recovery</h1>
          <p className="text-muted-foreground">
            Users who started checkout but didn&apos;t complete payment
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

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

      {/* Checkout List */}
      <Card>
        <CardHeader>
          <CardTitle>Abandoned Checkouts</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${checkouts.length} users started checkout but didn't complete`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : checkouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">All checkouts completed!</div>
              <p className="text-muted-foreground">No abandoned checkouts found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkouts.map((checkout) => (
                <div
                  key={checkout.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{checkout.email}</p>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Started <span className="font-medium text-orange-600">{checkout.hours_ago}h ago</span>
                        {" "}• {formatDate(checkout.created_at)}
                      </p>
                      {checkout.recovery_sent_at && (
                        <p className="text-amber-600 dark:text-amber-400">
                          Recovery email sent {formatDate(checkout.recovery_sent_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checkout.stripe_customer_id && (
                      <a
                        href={`https://dashboard.stripe.com/customers/${checkout.stripe_customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Stripe
                      </a>
                    )}
                    <Button
                      onClick={() => sendRecoveryEmail(checkout)}
                      disabled={sending === checkout.id}
                      size="sm"
                    >
                      {sending === checkout.id ? "Sending..." : checkout.recovery_sent_at ? "Resend" : "Send Email"}
                    </Button>
                  </div>
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
            This is the recovery email that will be sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p><strong>Subject:</strong> Complete your Coach Reflection upgrade</p>
            <hr className="my-2" />
            <p>Hi [Name],</p>
            <p>I noticed you started upgrading to Coach Reflection Pro but didn&apos;t finish.</p>
            <p>No worries - these things happen! Your cart is still waiting for you.</p>
            <p>As a reminder, Pro gives you:</p>
            <ul className="list-disc list-inside pl-2">
              <li>Unlimited reflections and conversations</li>
              <li>AI-powered theme extraction and insights</li>
              <li>Full analytics history</li>
              <li>CPD documentation export</li>
            </ul>
            <p>[Button: Complete Your Upgrade]</p>
            <p style={{ color: "#666" }}>Questions? Just reply to this email.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
