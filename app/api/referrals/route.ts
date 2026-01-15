import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Generate a unique referral code for a user
 */
function generateReferralCode(userId: string): string {
  const prefix = 'COACH'
  const hash = userId.substring(0, 8).toUpperCase()
  return `${prefix}${hash}`
}

/**
 * GET /api/referrals
 * Get referral data for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create referral code for user
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code, referral_rewards_earned')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError
    }

    // Generate code if doesn't exist
    if (!profile?.referral_code) {
      const referralCode = generateReferralCode(user.id)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      profile = { referral_code: referralCode, referral_rewards_earned: 0 }
    }

    // Get referral stats
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (referralsError) {
      throw referralsError
    }

    const stats = {
      total: referrals?.length || 0,
      pending: referrals?.filter(r => r.status === 'pending').length || 0,
      completed: referrals?.filter(r => r.status === 'completed').length || 0,
      rewarded: referrals?.filter(r => r.status === 'rewarded').length || 0,
      totalRewards: profile?.referral_rewards_earned || referrals?.reduce((sum, r) => sum + (parseFloat(r.reward_amount as string) || 0), 0) || 0
    }

    return NextResponse.json({
      referralCode: profile.referral_code,
      stats,
      referrals: referrals || []
    })
  } catch (error) {
    console.error('Referrals API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/referrals
 * Track a new referral (called when someone signs up with a code)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { referralCode } = body

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Find the referrer by code
    const { data: referrerProfile, error: referrerError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('referral_code', referralCode.toUpperCase())
      .single()

    if (referrerError || !referrerProfile) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      )
    }

    // Don't allow self-referral
    if (referrerProfile.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      )
    }

    // Check if user already used a referral code
    const { data: existingReferral } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('user_id', user.id)
      .single()

    if (existingReferral?.referred_by) {
      return NextResponse.json(
        { error: 'You have already used a referral code' },
        { status: 400 }
      )
    }

    // Create referral record
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerProfile.user_id,
        referred_id: user.id,
        referral_code: referralCode.toUpperCase(),
        status: 'pending',
        reward_type: 'pro_days',
        reward_amount: 7 // 7 days free Pro
      })

    if (insertError) {
      throw insertError
    }

    // Update referred user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referred_by: referrerProfile.user_id })
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Referral code applied successfully'
    })
  } catch (error) {
    console.error('Referral POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
