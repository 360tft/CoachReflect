import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { notifyNewFreeSignup, sendTemplateEmail, startOnboardingSequence } from '@/lib/email-sender'

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

      // Detect new user (created within last 5 minutes)
      const createdAt = new Date(data.user.created_at)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const isNewUser = createdAt > fiveMinutesAgo
      const isOAuthUser = !!data.user.app_metadata?.provider && data.user.app_metadata.provider !== 'email'
      const provider = (data.user.app_metadata?.provider as string) || 'email'

      // For new users: send welcome email, start onboarding, notify admin
      if (isNewUser && userEmail) {
        // Send welcome email immediately
        sendTemplateEmail(userEmail, 'welcome', {
          name: userName,
          userId: data.user.id,
        }).catch(console.error)

        // Start onboarding email sequence
        startOnboardingSequence(data.user.id).catch(console.error)

        // Notify admin of new free signup
        notifyNewFreeSignup(userEmail).catch(console.error)

        // Track signup event
        Promise.resolve(adminClient.from('analytics_events').insert({
          user_id: data.user.id,
          event_type: 'signup_completed',
          event_data: { provider, isOAuth: isOAuthUser },
          created_at: new Date().toISOString(),
        })).catch(console.error)

        // Set needs_mode_selection for OAuth users (no pre-signup form data)
        if (isOAuthUser) {
          Promise.resolve(adminClient
            .from('profiles')
            .update({
              auth_provider: provider,
              needs_mode_selection: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', data.user.id)
          ).catch(console.error)
        }
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
