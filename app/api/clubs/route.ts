import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getClubByAdmin, getClubWithMembers, getUserClubMembership } from "@/lib/clubs"

// GET /api/clubs - Get user's club (as admin or member)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // First check if user is a club admin
    const adminClub = await getClubByAdmin(user.id)
    if (adminClub) {
      const clubWithMembers = await getClubWithMembers(adminClub.id)
      return NextResponse.json({
        club: clubWithMembers,
        role: 'admin',
      })
    }

    // Check if user is a club member
    const membership = await getUserClubMembership(user.id)
    if (membership) {
      const clubWithMembers = await getClubWithMembers(membership.club.id)
      return NextResponse.json({
        club: clubWithMembers,
        role: membership.membership.role,
      })
    }

    return NextResponse.json({
      club: null,
      role: null,
    })

  } catch (error) {
    console.error("Get club error:", error)
    return NextResponse.json(
      { error: "Failed to get club" },
      { status: 500 }
    )
  }
}
