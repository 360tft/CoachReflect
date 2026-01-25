import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"

// Get client IP for rate limiting
async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  const realIP = headersList.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  return "unknown"
}

// Stricter rate limit for password reset: 3 attempts per 15 minutes
const FORGOT_PASSWORD_RATE_LIMIT = {
  maxRequests: 3,
  windowSeconds: 900, // 15 minutes
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = await getClientIP()

    // Rate limit by IP
    const ipRateLimit = await checkRateLimit(`forgot-password:ip:${clientIP}`, FORGOT_PASSWORD_RATE_LIMIT)
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many password reset attempts. Please try again later.",
          retry_after: ipRateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(ipRateLimit.resetInSeconds) },
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { email } = body as { email: string }

    // Validate input
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // Also rate limit by email to prevent targeted attacks
    const emailRateLimit = await checkRateLimit(`forgot-password:email:${email.toLowerCase()}`, FORGOT_PASSWORD_RATE_LIMIT)
    if (!emailRateLimit.allowed) {
      // Don't reveal that this email exists - use same generic message
      return NextResponse.json(
        {
          error: "Too many password reset attempts. Please try again later.",
          retry_after: emailRateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(emailRateLimit.resetInSeconds) },
        }
      )
    }

    // Send password reset email
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coachreflection.com"

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${baseUrl}/api/auth/callback?type=recovery`,
    })

    if (error) {
      console.error("[Forgot Password] Error:", error.message)
      // Don't reveal whether email exists - always show success
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("[Forgot Password] Error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
