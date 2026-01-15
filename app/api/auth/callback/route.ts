import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle password recovery redirect
  if (type === 'recovery') {
    const token_hash = searchParams.get('token_hash')
    if (token_hash) {
      return NextResponse.redirect(`${origin}/reset-password?token_hash=${token_hash}`)
    }
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user was referred (referral code in user metadata)
      const referralCode = data.user.user_metadata?.referral_code

      if (referralCode) {
        try {
          const adminClient = createAdminClient()

          // Find the referrer by code
          const { data: referrerProfile } = await adminClient
            .from('profiles')
            .select('user_id')
            .eq('referral_code', referralCode.toUpperCase())
            .single()

          if (referrerProfile && referrerProfile.user_id !== data.user.id) {
            // Check if referral already exists
            const { data: existingReferral } = await adminClient
              .from('referrals')
              .select('id')
              .eq('referred_id', data.user.id)
              .single()

            if (!existingReferral) {
              // Create referral record
              await adminClient
                .from('referrals')
                .insert({
                  referrer_id: referrerProfile.user_id,
                  referred_id: data.user.id,
                  referral_code: referralCode.toUpperCase(),
                  status: 'pending',
                  reward_type: 'pro_days',
                  reward_amount: 7
                })

              // Update referred user's profile
              await adminClient
                .from('profiles')
                .update({ referred_by: referrerProfile.user_id })
                .eq('user_id', data.user.id)
            }
          }
        } catch (err) {
          console.error('Failed to process referral:', err)
          // Don't block the auth flow if referral processing fails
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
