import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Cron job to reset monthly voice note limits
 * Should be run on the 1st of each month
 *
 * Vercel cron: 0 0 1 * * (midnight on 1st of each month)
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const adminClient = createAdminClient()

    // Call the database function to reset counts
    const { error } = await adminClient.rpc('reset_voice_note_counts')

    if (error) {
      console.error("[Cron Reset Limits] Error:", error)
      return NextResponse.json({ error: "Failed to reset limits" }, { status: 500 })
    }

    // Get count of reset profiles for logging
    const { count } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('voice_notes_reset_date', new Date().toISOString().split('T')[0])

    console.log(`[Cron Reset Limits] Reset voice note counts for ${count || 0} profiles`)

    return NextResponse.json({
      success: true,
      message: `Reset voice note limits`,
      profilesReset: count || 0,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("[Cron Reset Limits] Error:", error)
    return NextResponse.json({ error: "Failed to reset limits" }, { status: 500 })
  }
}
