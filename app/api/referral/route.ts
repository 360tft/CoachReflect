import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/referral - Get user's referral info
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Ensure user has a referral code
    const { data: codeData } = await adminClient.rpc('ensure_referral_code', {
      p_user_id: user.id
    })

    // Get profile with referral info
    const { data: profile } = await adminClient
      .from("profiles")
      .select("referral_code, referral_credits, referred_by")
      .eq("user_id", user.id)
      .single()

    // Get referral stats
    const { data: referrals } = await adminClient
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })

    const stats = {
      total_referrals: referrals?.length || 0,
      signed_up: referrals?.filter(r => r.status === 'signed_up').length || 0,
      converted: referrals?.filter(r => ['converted', 'rewarded'].includes(r.status)).length || 0,
      credits_earned: profile?.referral_credits || 0,
    }

    return NextResponse.json({
      referral_code: profile?.referral_code || codeData,
      referral_link: `https://coachreflection.com/signup?ref=${profile?.referral_code || codeData}`,
      stats,
      recent_referrals: referrals?.slice(0, 10).map(r => ({
        status: r.status,
        signed_up_at: r.signed_up_at,
        converted_at: r.converted_at,
        reward_type: r.reward_type,
      })) || [],
    })

  } catch {
    return NextResponse.json(
      { error: "Failed to fetch referral info" },
      { status: 500 }
    )
  }
}

// POST /api/referral - Apply referral code (for new signups)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { referral_code } = body

    if (!referral_code) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Check if user already has a referrer
    const { data: profile } = await adminClient
      .from("profiles")
      .select("referred_by")
      .eq("user_id", user.id)
      .single()

    if (profile?.referred_by) {
      return NextResponse.json({ error: "Already referred by another user" }, { status: 400 })
    }

    // Process the referral
    const { data: success } = await adminClient.rpc('process_referral_signup', {
      p_referred_id: user.id,
      p_referral_code: referral_code.toUpperCase(),
    })

    if (!success) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Referral applied successfully" })

  } catch {
    return NextResponse.json(
      { error: "Failed to apply referral code" },
      { status: 500 }
    )
  }
}
