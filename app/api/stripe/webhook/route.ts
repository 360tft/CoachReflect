import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClub, updateClubSubscription } from "@/lib/clubs"
import { notifyNewProSubscription, notifySubscriptionCanceled, sendProWelcomeEmail, sendAbandonedCheckoutEmail, sendTrialConvertedEmail, sendTrialCancelledEmail } from "@/lib/email-sender"
import { TRIAL_SEQUENCE } from "@/lib/email-sequences"
import { renderTemplate } from "@/lib/email-templates"
import { Resend } from "resend"
import type { ClubTier } from "@/lib/config"
import { getStripe } from "@/lib/stripe"

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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
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
          let subscriptionTier: "pro" | "pro_plus" = "pro"
          let subscriptionStatus: string = "active"

          if (session.subscription) {
            const subData = await stripe.subscriptions.retrieve(session.subscription as string)
            if (!userId) {
              userId = subData.metadata.user_id
            }

            // Use actual subscription status (could be "trialing" for trial checkouts)
            subscriptionStatus = subData.status

            // Determine tier from price ID
            const priceId = subData.items.data[0]?.price.id
            const proPlusPriceIds = [
              process.env.STRIPE_PRO_PLUS_PRICE_ID,
              process.env.STRIPE_PRO_PLUS_ANNUAL_PRICE_ID,
            ].filter(Boolean)

            if (priceId && proPlusPriceIds.includes(priceId)) {
              subscriptionTier = "pro_plus"
            }
          }

          if (userId) {
            await supabase
              .from("profiles")
              .update({
                subscription_tier: subscriptionTier,
                subscription_status: subscriptionStatus,
                stripe_customer_id: session.customer as string,
              })
              .eq("user_id", userId)

            // Notify admin of new Pro subscription
            const { data: userData } = await supabase.auth.admin.getUserById(userId)
            if (userData?.user?.email) {
              await notifyNewProSubscription(userData.user.email, session.amount_total || undefined)

              if (subscriptionStatus === "trialing") {
                // Trial checkout: stop onboarding sequence, start trial sequence, send welcome immediately
                await supabase
                  .from("email_sequences")
                  .update({ completed: true, paused: true })
                  .eq("user_id", userId)
                  .eq("sequence_name", "onboarding")
                  .eq("completed", false)

                const now = new Date()
                const nextStep = TRIAL_SEQUENCE[1]
                const nextSendDate = new Date(now)
                nextSendDate.setDate(nextSendDate.getDate() + (nextStep?.day || 3))

                await supabase.from("email_sequences").insert({
                  user_id: userId,
                  sequence_name: "trial",
                  current_step: 1,
                  started_at: now.toISOString(),
                  next_send_at: nextSendDate.toISOString(),
                  completed: false,
                  paused: false,
                })

                // Send trial-welcome immediately via Resend
                const userName = userData.user.user_metadata?.display_name || userData.user.email.split("@")[0] || "Coach"
                const html = renderTemplate("trial-welcome", { name: userName })
                if (html) {
                  const resendApiKey = process.env.RESEND_API_KEY
                  if (resendApiKey) {
                    const resend = new Resend(resendApiKey)
                    const fromEmail = process.env.RESEND_FROM_EMAIL || "Coach Reflection <hello@send.coachreflection.com>"
                    await resend.emails.send({
                      from: fromEmail,
                      to: userData.user.email,
                      subject: "Your 7-day Pro trial is live",
                      html,
                    })
                  }
                }

                // Log the sent email
                await supabase.from("email_log").insert({
                  user_id: userId,
                  email_type: "trial:trial-welcome",
                  subject: "Your 7-day Pro trial is live",
                })
              } else {
                // Non-trial: send Pro welcome email
                sendProWelcomeEmail(userData.user.email).catch(console.error)
              }
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

            // Check if this is a trial→active conversion before updating profile
            const { data: currentProfile } = await supabase
              .from("profiles")
              .select("subscription_status")
              .eq("user_id", userId)
              .single()

            const wasTrialing = currentProfile?.subscription_status === "trialing"

            // Determine tier from price ID
            let tier: "free" | "pro" | "pro_plus" = "free"
            if (status === "active" || status === "trialing") {
              const priceId = subscription.items.data[0]?.price.id
              const proPlusPriceIds = [
                process.env.STRIPE_PRO_PLUS_PRICE_ID,
                process.env.STRIPE_PRO_PLUS_ANNUAL_PRICE_ID,
              ].filter(Boolean)

              tier = priceId && proPlusPriceIds.includes(priceId) ? "pro_plus" : "pro"
            }

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

            // Send trial-converted email when trialing → active
            if (wasTrialing && status === "active") {
              const { data: userData } = await supabase.auth.admin.getUserById(userId)
              if (userData?.user?.email) {
                sendTrialConvertedEmail(userData.user.email).catch(console.error)
              }

              // Mark trial sequence as complete
              await supabase
                .from("email_sequences")
                .update({ completed: true, paused: true })
                .eq("user_id", userId)
                .eq("sequence_name", "trial")
                .eq("completed", false)
            }
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
            // Get user email and current status before updating
            const { data: userData } = await supabase.auth.admin.getUserById(userId)
            const { data: currentProfile } = await supabase
              .from("profiles")
              .select("subscription_status")
              .eq("user_id", userId)
              .single()

            const wasTrialing = currentProfile?.subscription_status === "trialing"

            await supabase
              .from("profiles")
              .update({
                subscription_tier: "free",
                subscription_status: "canceled",
                subscription_period_end: null,
              })
              .eq("user_id", userId)

            if (userData?.user?.email) {
              if (wasTrialing) {
                // Trial cancelled: send trial-specific cancellation email
                sendTrialCancelledEmail(userData.user.email).catch(console.error)

                // Mark trial sequence as complete
                await supabase
                  .from("email_sequences")
                  .update({ completed: true, paused: true })
                  .eq("user_id", userId)
                  .eq("sequence_name", "trial")
                  .eq("completed", false)
              } else {
                // Regular cancellation: notify admin
                await notifySubscriptionCanceled(userData.user.email)
              }
            }
          }
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        const customerEmail = session.customer_details?.email || session.customer_email

        if (customerEmail) {
          // Build recovery URL - Stripe provides after_expiration.recovery.url if recovery is enabled
          const recoveryUrl = (session as unknown as { after_expiration?: { recovery?: { url?: string } } })
            .after_expiration?.recovery?.url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'}/dashboard/settings`

          await sendAbandonedCheckoutEmail(customerEmail, recoveryUrl)
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
