import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { CLUB_TIERS, type ClubTier, type BillingPeriod } from "@/lib/config"
import { getClubByAdmin } from "@/lib/clubs"
import { getStripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`club-checkout:${user.id}`, RATE_LIMITS.AUTH)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Parse request
    const body = await request.json()
    const {
      club_name,
      tier,
      billing_period = 'monthly',
    }: {
      club_name: string
      tier: ClubTier
      billing_period: BillingPeriod
    } = body

    // Validate inputs
    if (!club_name || club_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Club name is required (minimum 2 characters)" },
        { status: 400 }
      )
    }

    if (!tier) {
      return NextResponse.json(
        { error: "Club tier is required" },
        { status: 400 }
      )
    }

    // Get tier configuration
    const tierConfig = CLUB_TIERS.find(t => t.id === tier)
    if (!tierConfig) {
      return NextResponse.json(
        { error: "Invalid club tier" },
        { status: 400 }
      )
    }

    // Check if user already has an active club
    const existingClub = await getClubByAdmin(user.id)
    if (existingClub) {
      return NextResponse.json(
        { error: "You already have an active club subscription" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get or create Stripe customer
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId = existingSub?.stripe_customer_id

    if (!customerId) {
      // Create Stripe customer
      const stripe = getStripe()
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Store customer ID
      await adminClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        }, {
          onConflict: "user_id",
        })
    }

    // Get the correct price ID
    const priceId = billing_period === 'annual'
      ? tierConfig.stripePriceIdAnnual
      : tierConfig.stripePriceIdMonthly

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured for this tier" },
        { status: 500 }
      )
    }

    // Create checkout session
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/club?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        supabase_user_id: user.id,
        type: "club",
        club_name: club_name.trim(),
        club_tier: tier,
        billing_period,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          type: "club",
          club_name: club_name.trim(),
          club_tier: tier,
        },
      },
      // Enable abandoned cart recovery
      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: true,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error("Club checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
