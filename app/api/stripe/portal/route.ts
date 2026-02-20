import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { APP_CONFIG } from "@/lib/config"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login", APP_CONFIG.url))
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.redirect(new URL("/dashboard/settings?error=no-subscription", APP_CONFIG.url))
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_CONFIG.url}/dashboard/settings`,
    })

    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error("Stripe portal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
