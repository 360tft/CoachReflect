import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check for billing period and plan from form data
    const formData = await request.formData().catch(() => null)
    const billingPeriod = formData?.get("billing") as string || "monthly"
    const plan = formData?.get("plan") as string || "pro"

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

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id)
    }

    // Select price based on plan and billing period
    let priceId: string | undefined
    if (plan === "pro_plus") {
      priceId = billingPeriod === "annual"
        ? process.env.STRIPE_PRO_PLUS_ANNUAL_PRICE_ID
        : process.env.STRIPE_PRO_PLUS_PRICE_ID
    } else {
      priceId = billingPeriod === "annual"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
    }

    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 })
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
      success_url: `${request.headers.get("origin")}/dashboard/settings?success=true`,
      cancel_url: `${request.headers.get("origin")}/dashboard/settings?canceled=true`,
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    })

    if (session.url) {
      return NextResponse.redirect(session.url)
    }

    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
