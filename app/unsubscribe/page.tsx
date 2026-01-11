"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("user")
  const email = searchParams.get("email")

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [action, setAction] = useState<"unsubscribed" | "resubscribed" | null>(null)

  const handleUnsubscribe = async () => {
    setStatus("loading")
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          action: "unsubscribe_all",
        }),
      })

      if (res.ok) {
        setStatus("success")
        setAction("unsubscribed")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  const handleResubscribe = async () => {
    setStatus("loading")
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          action: "resubscribe",
        }),
      })

      if (res.ok) {
        setStatus("success")
        setAction("resubscribed")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  if (!userId && !email) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🪞</div>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This unsubscribe link appears to be invalid.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">
              {action === "unsubscribed" ? "📭" : "📬"}
            </div>
            <CardTitle>
              {action === "unsubscribed" ? "Unsubscribed" : "Resubscribed"}
            </CardTitle>
            <CardDescription>
              {action === "unsubscribed"
                ? "You've been unsubscribed from all CoachReflect emails."
                : "You've been resubscribed to CoachReflect emails."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {action === "unsubscribed" && (
              <p className="text-sm text-muted-foreground">
                Changed your mind?{" "}
                <button
                  onClick={handleResubscribe}
                  className="text-amber-600 hover:underline"
                >
                  Resubscribe
                </button>
              </p>
            )}
            <Link href="/">
              <Button variant="outline">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🪞</div>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Manage your email notifications from CoachReflect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "error" && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              <p className="text-sm text-destructive">
                Something went wrong. Please try again.
              </p>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Unsubscribe from all emails</p>
            <p className="text-sm text-muted-foreground mb-4">
              You'll stop receiving onboarding emails, streak reminders, and product updates.
            </p>
            <Button
              onClick={handleUnsubscribe}
              disabled={status === "loading"}
              variant="outline"
              className="w-full"
            >
              {status === "loading" ? "Processing..." : "Unsubscribe"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can always resubscribe later from your account settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
