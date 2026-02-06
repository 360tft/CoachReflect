"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Capacitor } from "@capacitor/core"
import { createClient } from "@/lib/supabase/client"
import { signupFallback } from "./actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref")

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  // Store referral code in session storage for use after signup
  useEffect(() => {
    if (referralCode) {
      sessionStorage.setItem("referral_code", referralCode)
    }
  }, [referralCode])

  const handleGoogleSignup = async () => {
    setError(null)
    setGoogleLoading(true)

    const supabase = createClient()
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (googleError) {
      setError(googleError.message)
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Get referral code from session storage (in case they arrived via referral link)
    const storedReferralCode = sessionStorage.getItem("referral_code") || referralCode

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          referral_code: storedReferralCode, // Store in user metadata for processing
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If user is auto-confirmed (email confirmation disabled), apply referral code
    if (data.user && storedReferralCode) {
      try {
        await fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referral_code: storedReferralCode })
        })
        // Clear the stored referral code
        sessionStorage.removeItem("referral_code")
      } catch {
        // Referral application failed silently - not critical
      }
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Start Your Journey</CardTitle>
        <CardDescription>
          Create an account to begin reflecting on your coaching
        </CardDescription>
      </CardHeader>
      <CardContent>
        {referralCode && (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Referral code applied! You&apos;ll both get 7 days of Pro free when you subscribe.</span>
          </div>
        )}

        {/* Google Sign Up - hidden on native (doesn't work in WKWebView) */}
        {!isNative && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                "Connecting..."
              ) : (
                <>
                  <GoogleIcon />
                  <span className="ml-2">Continue with Google</span>
                </>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
          </>
        )}

        <form action={signupFallback} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || googleLoading}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || googleLoading}
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground mt-1">
              At least 6 characters
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || googleLoading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          <Link href="/" className="hover:underline">
            ← Back to Home
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center px-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <SignupForm />
      </Suspense>
    </div>
  )
}
