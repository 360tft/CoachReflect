import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/referrals/track
 * Track when referred user completes an action (e.g., subscribes)
 * Called internally when a referred user upgrades to Pro
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Find the referral record for this user
    const { data: referral, error: referralError } = await adminClient
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .single()

    if (referralError || !referral) {
      // No pending referral found - that's okay, not everyone is referred
      return NextResponse.json({ success: true, message: 'No pending referral' })
    }

    // Update referral status to completed
    const { error: updateError } = await adminClient
      .from('referrals')
      .update({
        status: action === 'subscribed' ? 'completed' : 'rewarded',
        completed_at: new Date().toISOString()
      })
      .eq('id', referral.id)

    if (updateError) {
      throw updateError
    }

    // If completed, award the referrer
    if (action === 'subscribed') {
      // Add reward days to referrer's profile
      const rewardDays = referral.reward_amount || 7

      const { error: rewardError } = await adminClient
        .from('profiles')
        .update({
          referral_rewards_earned: adminClient.rpc('increment_referral_rewards', {
            user_uuid: referral.referrer_id,
            days: rewardDays
          })
        })
        .eq('user_id', referral.referrer_id)

      // Alternative: just increment the counter directly
      if (rewardError) {
        // If RPC doesn't exist, try direct update
        const { data: referrerProfile } = await adminClient
          .from('profiles')
          .select('referral_rewards_earned')
          .eq('user_id', referral.referrer_id)
          .single()

        const currentRewards = referrerProfile?.referral_rewards_earned || 0

        await adminClient
          .from('profiles')
          .update({
            referral_rewards_earned: currentRewards + rewardDays
          })
          .eq('user_id', referral.referrer_id)
      }

      // Update referral status to rewarded
      await adminClient
        .from('referrals')
        .update({ status: 'rewarded' })
        .eq('id', referral.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Referral tracked successfully'
    })
  } catch (error) {
    console.error('Referral track error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
