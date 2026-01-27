import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { PricingSection } from "@/app/components/pricing-section"
import { Footer } from "@/app/components/footer"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Pricing | Coach Reflection",
  description: "Simple pricing for coaches. Start free, upgrade when you need more features like voice notes, session plan uploads, and AI insights.",
}

export default async function PricingPage() {
  let isLoggedIn = false

  // Gracefully handle missing Supabase credentials (local dev without env vars)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Supabase not configured - show logged out state
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Coach Reflection" width={240} height={40} className="h-10 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png" alt="Coach Reflection" width={240} height={40} className="h-10 w-auto hidden dark:block" />
        </Link>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-8">Pricing FAQ</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Can I try before I buy?</h3>
            <p className="text-muted-foreground">
              Yes! The free tier gives you 5 messages per day and 7 days of history.
              No credit card required to start.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards through Stripe. Your payment information
              is securely processed and never stored on our servers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-muted-foreground">
              Yes, you can cancel your subscription at any time. You&apos;ll keep access
              until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What do I get with Pro?</h3>
            <p className="text-muted-foreground">
              Pro gives you unlimited messages, voice notes, session plan uploads,
              AI-powered insights, full analytics history, and an AI that learns your
              coaching style over time.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Do you offer team/club pricing?</h3>
            <p className="text-muted-foreground">
              Yes! If you need accounts for multiple coaches, get in touch and
              we&apos;ll set up a plan that works for your club.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
