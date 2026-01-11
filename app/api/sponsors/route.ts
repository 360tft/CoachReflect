// GET /api/sponsors - Get active sponsors for display
// Returns list of sponsors ordered by slot number

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_SPONSOR_SPOTS = 3

export async function GET() {
  try {
    const supabase = await createClient()

    // Get active sponsors
    const { data: sponsors, error } = await supabase
      .from('sponsors')
      .select('id, name, tagline, url, logo_url, bg_color, slot_number')
      .eq('status', 'active')
      .order('slot_number', { ascending: true })

    if (error) {
      console.error('Error fetching sponsors:', error)
      return NextResponse.json({
        sponsors: [],
        takenSlots: [],
        availableCount: MAX_SPONSOR_SPOTS,
      })
    }

    const takenSlots = sponsors?.map(s => s.slot_number) || []
    const availableCount = MAX_SPONSOR_SPOTS - takenSlots.length

    return NextResponse.json({
      sponsors: sponsors || [],
      takenSlots,
      availableCount,
      maxSpots: MAX_SPONSOR_SPOTS,
    })
  } catch (error) {
    console.error('Sponsors API error:', error)
    return NextResponse.json({
      sponsors: [],
      takenSlots: [],
      availableCount: MAX_SPONSOR_SPOTS,
    })
  }
}
