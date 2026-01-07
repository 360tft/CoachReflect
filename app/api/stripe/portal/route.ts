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

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.redirect(new URL("/dashboard/settings?error=no-subscription", request.url))
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${request.headers.get("origin")}/dashboard/settings`,
    })

    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error("Stripe portal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
