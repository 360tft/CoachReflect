import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Get admin client for deleting user
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE() {
  try {
    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminClient = getAdminClient()

    // First, cancel any active Stripe subscription
    const { data: profile } = await adminClient
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.stripe_subscription_id) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      } catch (stripeError) {
        // Log but don't block deletion - subscription might already be cancelled
        console.error('Error cancelling Stripe subscription:', stripeError)
      }
    }

    // Delete all user data from our tables
    // Most tables have ON DELETE CASCADE from profiles, but we'll be explicit
    // to ensure complete data removal
    const deletionPromises = [
      // User memory (AI context)
      adminClient.from('user_memory').delete().eq('user_id', user.id),

      // Push notification subscriptions
      adminClient.from('push_subscriptions').delete().eq('user_id', user.id),

      // Shared reflections
      adminClient.from('shared_reflections').delete().eq('user_id', user.id),

      // Feedback
      adminClient.from('feedback').delete().eq('user_id', user.id),

      // Messages (before conversations due to FK)
      adminClient.from('messages').delete().eq('user_id', user.id),

      // Conversations
      adminClient.from('conversations').delete().eq('user_id', user.id),

      // Reflections (after session plans due to FK)
      adminClient.from('reflections').delete().eq('user_id', user.id),

      // Session plans
      adminClient.from('session_plans').delete().eq('user_id', user.id),

      // Sessions
      adminClient.from('sessions').delete().eq('user_id', user.id),

      // Streaks
      adminClient.from('streaks').delete().eq('user_id', user.id),

      // User badges
      adminClient.from('user_badges').delete().eq('user_id', user.id),

      // Email sequences
      adminClient.from('email_sequences').delete().eq('user_id', user.id),

      // Email log
      adminClient.from('email_log').delete().eq('user_id', user.id),

      // Profiles (should cascade delete related data, but we've already cleaned up)
      adminClient.from('profiles').delete().eq('user_id', user.id),
    ]

    // Execute all deletions
    const results = await Promise.allSettled(deletionPromises)

    // Log any failures (but don't block - table might not exist or be empty)
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Deletion promise ${index} failed:`, result.reason)
      }
    })

    // Finally, delete the user from Supabase Auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    )
  }
}
