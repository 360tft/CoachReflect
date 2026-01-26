import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import type { Metadata } from "next"
import { ReferralDashboard } from "./referral-dashboard"

export const metadata: Metadata = {
  title: "Refer a Coach | Coach Reflection",
  description: "Share Coach Reflection with other coaches and earn free Pro months.",
}

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not logged in, show public referral info
  if (!user) {
    return <PublicReferralPage />
  }

  const adminClient = createAdminClient()

  // Ensure user has a referral code
  await adminClient.rpc('ensure_referral_code', { p_user_id: user.id })

  // Get profile with referral info
  const { data: profile } = await adminClient
    .from("profiles")
    .select("referral_code, referral_credits")
    .eq("user_id", user.id)
    .single()

  // Get referral stats
  const { data: referrals } = await adminClient
    .from("referrals")
    .select("*")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })

  const stats = {
    total_referrals: referrals?.length || 0,
    signed_up: referrals?.filter(r => r.status === 'signed_up').length || 0,
    converted: referrals?.filter(r => ['converted', 'rewarded'].includes(r.status)).length || 0,
    credits_earned: profile?.referral_credits || 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">Coach Reflection</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Refer a Coach</h1>
        <p className="text-muted-foreground mb-8">
          Share Coach Reflection and earn free Pro months when your referrals upgrade
        </p>

        <ReferralDashboard
          referralCode={profile?.referral_code || ''}
          stats={stats}
          recentReferrals={referrals?.slice(0, 5) || []}
        />

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Copy your unique referral link and share it with coaches in your network.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold">They Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  When a coach signs up using your link, they&apos;re connected to you.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold">You Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  When they upgrade to Pro, you get 1 free month of Pro added to your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12 pt-6 border-t">
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}

function PublicReferralPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Coach Reflection</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Refer a Coach</h1>
        <p className="text-muted-foreground mb-8">
          Help other coaches improve through reflection and earn rewards
        </p>

        <div className="p-6 bg-muted/50 border rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">Earn Free Pro Months</h2>
          <p className="text-muted-foreground mb-4">
            Sign up for Coach Reflection to get your unique referral link.
            When coaches you refer upgrade to Pro, you get free months added to your account.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90"
          >
            Sign Up to Start Referring
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Why Share Coach Reflection?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Help Coaches Improve</h3>
              <p className="text-sm text-muted-foreground">
                Reflection is one of the most powerful tools for coaching development.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Earn Free Months</h3>
              <p className="text-sm text-muted-foreground">
                Get 1 free month of Pro for every coach you refer who upgrades.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">No Limit</h3>
              <p className="text-sm text-muted-foreground">
                Refer as many coaches as you want. Stack up free months.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Easy Sharing</h3>
              <p className="text-sm text-muted-foreground">
                One-click copy of your unique referral link to share anywhere.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 pt-6 border-t flex gap-4">
          <Link href="/" className="text-primary hover:underline">
            Back to Home
          </Link>
          <Link href="/login" className="text-primary hover:underline">
            Log In
          </Link>
        </div>
      </main>
    </div>
  )
}
