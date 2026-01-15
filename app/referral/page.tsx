import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refer a Coach",
  description: "Share CoachReflect with other football coaches. Help them improve their sessions through reflection.",
}

export default function ReferralPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">CoachReflect</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Refer a Coach</h1>
        <p className="text-muted-foreground mb-8">
          Help other coaches improve their sessions through reflection
        </p>

        {/* Coming Soon Banner */}
        <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Referral Program Coming Soon
          </h2>
          <p className="text-amber-700 dark:text-amber-300">
            We&apos;re building a referral program that will reward you for sharing CoachReflect with other coaches.
            Stay tuned for updates!
          </p>
        </div>

        {/* Why Refer */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Why Share CoachReflect?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Help Coaches Improve</h3>
              <p className="text-sm text-muted-foreground">
                Reflection is one of the most powerful tools for coaching development.
                Share it with coaches who want to get better.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Build a Better Community</h3>
              <p className="text-sm text-muted-foreground">
                The more coaches using CoachReflect, the more we can learn about
                what helps coaches improve.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Coming: Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Soon you&apos;ll be able to earn free months of Pro when friends
                you refer upgrade their account.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Easy to Share</h3>
              <p className="text-sm text-muted-foreground">
                Just send them to coachreflect.com. They can try it free and
                see the value for themselves.
              </p>
            </div>
          </div>
        </section>

        {/* How to Share */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How to Share</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-800 dark:text-amber-200 font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Share the Link</h3>
                <p className="text-sm text-muted-foreground">
                  Send <span className="font-mono bg-muted px-2 py-1 rounded">coachreflect.com</span> to
                  coaches in your network, club, or coaching community.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-800 dark:text-amber-200 font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Share Your Reflections</h3>
                <p className="text-sm text-muted-foreground">
                  Use the share feature to send example reflections. Show them what&apos;s possible.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-800 dark:text-amber-200 font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Spread the Word</h3>
                <p className="text-sm text-muted-foreground">
                  Post about your experience on social media, in coaching groups, or at coaching events.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Get Notified */}
        <div className="p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Get Notified When Referrals Launch</h2>
          <p className="text-muted-foreground mb-4">
            We&apos;ll email you when the referral program is ready with your unique referral link.
          </p>
          <p className="text-sm text-muted-foreground">
            Already using CoachReflect? You&apos;ll automatically be notified via email.
          </p>
        </div>

        <div className="mt-12 pt-6 border-t flex gap-4">
          <Link href="/" className="text-primary hover:underline">
            Back to Home
          </Link>
          <Link href="/dashboard" className="text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
