import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url), 303)
    }

    // Determine if this is a JSON request (fetch) or form submission
    const contentType = request.headers.get("content-type") || ""
    const accept = request.headers.get("accept") || ""
    const isJson = contentType.includes("application/json") || accept.includes("application/json")

    let billingPeriod = "monthly"
    let plan = "pro"

    if (isJson) {
      const json = await request.json().catch(() => ({}))
      billingPeriod = json.billing_period || json.billing || "monthly"
      plan = json.plan || "pro"
    } else {
      const formData = await request.formData().catch(() => null)
      billingPeriod = formData?.get("billing") as string || "monthly"
      plan = formData?.get("plan") as string || "pro"
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
      if (isJson) {
        return NextResponse.json({ url: session.url })
      }
      return NextResponse.redirect(session.url, 303)
    }

    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      error: "Checkout failed",
      details: message,
      hint: message.includes("STRIPE") ? "Check Stripe environment variables" : undefined
    }, { status: 500 })
  }
}
