import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClub, updateClubSubscription } from "@/lib/clubs"
import { notifyNewProSubscription, notifySubscriptionCanceled } from "@/lib/email-sender"
import type { ClubTier } from "@/lib/config"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// Idempotency: Track processed events to prevent duplicates
const processedEvents = new Map<string, number>()
const EVENT_TTL = 5 * 60 * 1000 // 5 minutes

function cleanupProcessedEvents() {
  const now = Date.now()
  for (const [eventId, timestamp] of processedEvents) {
    if (now - timestamp > EVENT_TTL) {
      processedEvents.delete(eventId)
    }
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Idempotency check - prevent duplicate processing
  cleanupProcessedEvents()
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionType = session.metadata?.type

        if (subscriptionType === "club") {
          // Handle club subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as Stripe.Subscription
          const userId = session.metadata?.supabase_user_id
          const clubName = session.metadata?.club_name
          const clubTier = session.metadata?.club_tier as ClubTier
          const billingPeriod = session.metadata?.billing_period as 'monthly' | 'annual'
          const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

          if (userId && clubName && clubTier) {
            // Create the club
            await createClub({
              name: clubName,
              adminUserId: userId,
              tier: clubTier,
              billingPeriod: billingPeriod || 'monthly',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
            })
          }
        } else {
          // Handle individual subscription
          let userId = session.metadata?.supabase_user_id
          if (!userId && session.subscription) {
            const subData = await stripe.subscriptions.retrieve(session.subscription as string)
            userId = subData.metadata.user_id
          }

          if (userId) {
            await supabase
              .from("profiles")
              .update({
                subscription_tier: "pro",
                subscription_status: "active",
                stripe_customer_id: session.customer as string,
              })
              .eq("user_id", userId)

            // Notify admin of new Pro subscription
            const { data: userData } = await supabase.auth.admin.getUserById(userId)
            if (userData?.user?.email) {
              await notifyNewProSubscription(userData.user.email, session.amount_total || undefined)
            }

            // Process referral conversion - credit referrer with free month if applicable
            // First, check if this user was referred
            const { data: referral } = await supabase
              .from("referrals")
              .select("referrer_id, status")
              .eq("referred_id", userId)
              .in("status", ["pending", "signed_up"])
              .single()

            if (referral) {
              // Get referrer's Stripe customer ID
              const { data: referrerProfile } = await supabase
                .from("profiles")
                .select("stripe_customer_id")
                .eq("user_id", referral.referrer_id)
                .single()

              // Add credit to referrer's Stripe account (1 month = ~$8)
              if (referrerProfile?.stripe_customer_id) {
                try {
                  // Add $7.99 credit (negative amount = credit)
                  await stripe.customers.createBalanceTransaction(
                    referrerProfile.stripe_customer_id,
                    {
                      amount: -799, // -$7.99 in cents (credit)
                      currency: "usd",
                      description: "Referral reward: 1 month free Pro",
                    }
                  )
                } catch (stripeError) {
                  // Log but don't fail the webhook
                  console.error("Failed to add referral credit:", stripeError)
                }
              }

              // Update referral record via RPC
              await supabase.rpc("process_referral_conversion", {
                p_referred_id: userId,
              })
            }
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number }
        const subscriptionType = subscription.metadata.type

        if (subscriptionType === "club") {
          // Handle club subscription update
          const status = subscription.status as 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'trialing'
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined

          await updateClubSubscription(subscription.id, status, periodEnd)
        } else {
          // Handle individual subscription update
          const userId = subscription.metadata.user_id

          if (userId) {
            const status = subscription.status
            const tier = status === "active" ? "pro" : "free"
            const periodEnd = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null

            await supabase
              .from("profiles")
              .update({
                subscription_tier: tier,
                subscription_status: status,
                subscription_period_end: periodEnd,
              })
              .eq("user_id", userId)
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionType = subscription.metadata.type

        if (subscriptionType === "club") {
          // Handle club subscription cancellation
          await updateClubSubscription(subscription.id, 'cancelled')
        } else {
          // Handle individual subscription cancellation
          const userId = subscription.metadata.user_id

          if (userId) {
            // Get user email before updating
            const { data: userData } = await supabase.auth.admin.getUserById(userId)

            await supabase
              .from("profiles")
              .update({
                subscription_tier: "free",
                subscription_status: "canceled",
                subscription_period_end: null,
              })
              .eq("user_id", userId)

            // Notify admin of cancellation
            if (userData?.user?.email) {
              await notifySubscriptionCanceled(userData.user.email)
            }
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        const subscriptionId = invoice.subscription

        if (subscriptionId && typeof subscriptionId === "string") {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata.user_id

          if (userId) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "past_due",
              })
              .eq("user_id", userId)
          }
        }
        break
      }
    }

    // Mark event as processed
    processedEvents.set(event.id, Date.now())

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
