import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { display_name, club_name, age_group, coaching_level, sport } = body

  // Validate coaching_level if provided
  const validLevels = ['grassroots', 'academy', 'semi-pro', 'professional']
  if (coaching_level && !validLevels.includes(coaching_level)) {
    return NextResponse.json({ error: "Invalid coaching level" }, { status: 400 })
  }

  // Validate sport if provided
  const validSports = [
    'football', 'rugby', 'basketball', 'hockey', 'tennis', 'cricket',
    'volleyball', 'baseball', 'american_football', 'swimming', 'athletics',
    'gymnastics', 'martial_arts', 'other'
  ]
  if (sport && !validSports.includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: display_name || null,
      club_name: club_name || null,
      age_group: age_group || null,
      coaching_level: coaching_level || null,
      sport: sport || 'football',
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
