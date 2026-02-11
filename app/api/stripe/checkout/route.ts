import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body — accept both JSON and form data
    const contentType = request.headers.get("content-type") || ""
    let billingPeriod = "monthly"
    let plan = "pro"

    if (contentType.includes("application/json")) {
      const json = await request.json().catch(() => ({}))
      billingPeriod = json.billing_period || json.billing || "monthly"
      plan = json.plan || "pro"
    } else {
      const formData = await request.formData().catch(() => null)
      billingPeriod = formData?.get("billing") as string || "monthly"
      plan = formData?.get("plan") as string || "pro"
    }

    // Get profile (need stripe_customer_id and pro_trial_used)
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, pro_trial_used")
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
      const missingVar = plan === "pro_plus"
        ? (billingPeriod === "annual" ? "STRIPE_PRO_PLUS_ANNUAL_PRICE_ID" : "STRIPE_PRO_PLUS_PRICE_ID")
        : (billingPeriod === "annual" ? "NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID" : "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID")
      console.error(`Missing Stripe price ID: ${missingVar}`)
      return NextResponse.json({
        error: "Price not configured",
        details: `Missing environment variable: ${missingVar}`
      }, { status: 500 })
    }

    const appUrl = "https://coachreflection.com"

    // Determine if user is eligible for 7-day free trial
    const trialEligible = !profile?.pro_trial_used

    // Mark trial as used immediately (prevents second trial even if they abandon checkout)
    if (trialEligible) {
      const adminClient = createAdminClient()
      await adminClient
        .from("profiles")
        .update({ pro_trial_used: true })
        .eq("user_id", user.id)
    }

    // Create checkout session — with trial if eligible
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/settings?success=true`,
      cancel_url: `${appUrl}/dashboard/settings?canceled=true`,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
        ...(trialEligible ? { trial_period_days: 7 } : {}),
      },
    })

    // Always return JSON — client handles redirect
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      error: "Checkout failed",
      details: message,
    }, { status: 500 })
  }
}
