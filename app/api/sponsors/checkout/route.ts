// POST /api/sponsors/checkout - Create Stripe checkout for sponsor subscription
// Sponsors pay monthly to advertise on Coach Reflection

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

const SPONSOR_PRICE_ID = process.env.STRIPE_SPONSOR_PRICE_ID

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SPONSOR_PRICE_ID) {
      console.error('STRIPE_SPONSOR_PRICE_ID not configured')
      return NextResponse.json(
        { error: 'Sponsorship not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { slot_number, company_name, company_url, tagline, logo_url, bg_color } = body

    if (!slot_number || !company_name || !company_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slot is available
    const { data: existingSlot } = await supabase
      .from('sponsors')
      .select('id')
      .eq('slot_number', slot_number)
      .eq('status', 'active')
      .single()

    if (existingSlot) {
      return NextResponse.json(
        { error: 'This slot is already taken' },
        { status: 409 }
      )
    }

    // Create pending sponsor record
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .insert({
        user_id: user.id,
        name: company_name,
        url: company_url,
        tagline: tagline || null,
        logo_url: logo_url || null,
        bg_color: bg_color || '#E5A11C',
        slot_number,
        status: 'pending',
      })
      .select('id')
      .single()

    if (sponsorError) {
      console.error('Failed to create sponsor record:', sponsorError)
      return NextResponse.json(
        { error: 'Failed to create sponsor record' },
        { status: 500 }
      )
    }

    // Create Stripe checkout session
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: SPONSOR_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        sponsor_id: sponsor.id,
        slot_number: String(slot_number),
        product: 'coachreflect_sponsor',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/sponsors/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/sponsors?cancelled=true`,
      customer_email: user.email!,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Sponsor checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
