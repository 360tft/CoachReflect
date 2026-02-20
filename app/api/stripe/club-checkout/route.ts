import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CLUB_TIERS, APP_CONFIG } from "@/lib/config"
import { getStripe } from "@/lib/stripe"

// Map tier IDs to Stripe price env var names
const TIER_PRICE_MAP: Record<string, { monthly: string; annual: string }> = {
  club_small: {
    monthly: "STRIPE_PRICE_CLUB_SMALL_MONTHLY",
    annual: "STRIPE_PRICE_CLUB_SMALL_ANNUAL",
  },
  club: {
    monthly: "STRIPE_PRICE_CLUB_MONTHLY",
    annual: "STRIPE_PRICE_CLUB_ANNUAL",
  },
  club_academy: {
    monthly: "STRIPE_PRICE_CLUB_ACADEMY_MONTHLY",
    annual: "STRIPE_PRICE_CLUB_ACADEMY_ANNUAL",
  },
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clubName, tier, billing } = body

    if (!clubName || !tier || !billing) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate tier
    const tierConfig = CLUB_TIERS.find((t) => t.id === tier)
    if (!tierConfig) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    // Get price ID from env
    const priceMap = TIER_PRICE_MAP[tier]
    if (!priceMap) {
      return NextResponse.json({ error: "Tier not configured" }, { status: 500 })
    }

    const envVarName = billing === "annual" ? priceMap.annual : priceMap.monthly
    const priceId = process.env[envVarName]

    if (!priceId) {
      console.error(`Missing Stripe price ID: ${envVarName}`)
      return NextResponse.json({
        error: "Price not configured",
        details: `Missing environment variable: ${envVarName}`
      }, { status: 500 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    const stripe = getStripe()

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_CONFIG.url}/dashboard/club/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_CONFIG.url}/dashboard/club/create?canceled=true`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          type: "club",
          club_name: clubName,
          club_tier: tier,
        },
      },
      metadata: {
        type: "club",
        supabase_user_id: user.id,
        club_name: clubName,
        club_tier: tier,
        billing_period: billing,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Club checkout error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      error: "Checkout failed",
      details: message,
    }, { status: 500 })
  }
}
