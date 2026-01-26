import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { notifyNewSignup, sendTemplateEmail } from '@/lib/email-sender'

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
      const adminClient = createAdminClient()
      const userEmail = data.user.email
      const userName = data.user.user_metadata?.display_name || userEmail?.split('@')[0] || 'Coach'

      // Check if this is a new user (profile just created)
      const { data: profile } = await adminClient
        .from('profiles')
        .select('created_at')
        .eq('user_id', data.user.id)
        .single()

      const isNewUser = profile &&
        new Date(profile.created_at).getTime() > Date.now() - 60000 // Created within last minute

      // For new users: send welcome email and notify admin
      if (isNewUser && userEmail) {
        // Send welcome email immediately
        await sendTemplateEmail(userEmail, 'welcome', {
          name: userName,
          userId: data.user.id,
        })

        // Start onboarding email sequence
        const now = new Date()
        const nextSendDate = new Date(now)
        nextSendDate.setDate(nextSendDate.getDate() + 1) // First follow-up email tomorrow

        await adminClient.from('email_sequences').insert({
          user_id: data.user.id,
          sequence_name: 'onboarding',
          current_step: 1, // Skip step 0 (welcome) since we just sent it
          started_at: now.toISOString(),
          next_send_at: nextSendDate.toISOString(),
          completed: false,
          paused: false,
        })

        // Notify admin of new signup
        await notifyNewSignup(userEmail)
      }

      // Check if user was referred (referral code in user metadata)
      const referralCode = data.user.user_metadata?.referral_code

      if (referralCode) {
        try {
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
              // Create referral record (1 month = 30 days reward)
              await adminClient
                .from('referrals')
                .insert({
                  referrer_id: referrerProfile.user_id,
                  referred_id: data.user.id,
                  referral_code: referralCode.toUpperCase(),
                  status: 'pending',
                  reward_type: 'free_month',
                  reward_amount: 30
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
