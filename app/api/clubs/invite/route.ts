import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getClubByAdmin, inviteCoach, getClubWithMembers, removeCoach } from "@/lib/clubs"

// POST /api/clubs/invite - Invite a coach to the club
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`club-invite:${user.id}`, RATE_LIMITS.AUTH)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Get user's club (must be admin)
    const club = await getClubByAdmin(user.id)
    if (!club) {
      return NextResponse.json(
        { error: "You must be a club admin to invite members" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    try {
      const membership = await inviteCoach(club.id, email, user.id)

      // TODO: Send invitation email via Resend

      return NextResponse.json({
        success: true,
        membership,
      })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to invite coach" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Club invite error:", error)
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    )
  }
}

// DELETE /api/clubs/invite - Remove a member from the club
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's club (must be admin)
    const club = await getClubByAdmin(user.id)
    if (!club) {
      return NextResponse.json(
        { error: "You must be a club admin to remove members" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { membership_id } = body

    if (!membership_id) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      )
    }

    try {
      await removeCoach(club.id, membership_id, user.id)
      return NextResponse.json({ success: true })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to remove member" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Club remove error:", error)
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    )
  }
}
