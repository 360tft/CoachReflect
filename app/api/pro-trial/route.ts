import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Check if user has used their Pro trial
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ hasUsedTrial: true }) // Treat logged-out users as having used trial
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('pro_trial_used')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      hasUsedTrial: profile?.pro_trial_used ?? false
    })
  } catch (error) {
    console.error('Error checking Pro trial status:', error)
    return NextResponse.json({ hasUsedTrial: true }) // Fail closed - assume used
  }
}

// POST - Mark Pro trial as used and perform the trial action
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Must be logged in to use Pro trial' },
        { status: 401 }
      )
    }

    // Check if already used
    const { data: profile } = await supabase
      .from('profiles')
      .select('pro_trial_used')
      .eq('user_id', user.id)
      .single()

    if (profile?.pro_trial_used) {
      return NextResponse.json(
        { error: 'Pro trial already used', hasUsedTrial: true },
        { status: 403 }
      )
    }

    // Mark as used
    const { error } = await supabase
      .from('profiles')
      .update({ pro_trial_used: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error marking Pro trial as used:', error)
      return NextResponse.json(
        { error: 'Failed to update trial status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, hasUsedTrial: true })
  } catch (error) {
    console.error('Error updating Pro trial status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
