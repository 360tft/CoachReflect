import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CoachReflection for FCA Members | Football Coaching Academy",
  description:
    "Built for FCA coaches. Reflect on your sessions, track patterns, and grow faster with AI-powered coaching insights.",
}

const TESTIMONIALS = [
  {
    quote:
      "I've been reflecting a lot more since joining this community and I've definitely made positive changes to my coaching.",
    name: "Stephen Kavanagh",
    role: "FCA Member",
  },
  {
    quote:
      "It is probably the best resource I have found in developing my coaching knowledge. The community is my home.",
    name: "FCA Coach",
    role: "Football Coaching Academy",
  },
  {
    quote:
      "I've been focussing on better detail in my coaching which I've improved. Now it is giving specific feedback to players.",
    name: "Stephen Kavanagh",
    role: "FCA Member",
  },
]

export default function FCALandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="CoachReflection" width={240} height={40} className="h-10 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png" alt="CoachReflection" width={240} height={40} className="h-10 w-auto hidden dark:block" />
        </Link>
        <Link href="/signup">
          <Button>Get Started Free</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary mb-3">
            For Football Coaching Academy Members
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            The reflection tool I built<br />for coaches like us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You already know reflection matters. You talk about it in FCA all the time.
            But who actually does it consistently? This makes it simple.
          </p>
        </div>

        {/* Personal note from Kevin */}
        <Card className="mb-12">
          <CardContent className="py-6">
            <p className="text-muted-foreground mb-4">
              I built CoachReflection because I kept telling coaches in FCA to reflect after sessions,
              but I wasn&apos;t doing it properly myself. Writing in a notebook felt like homework.
              Talking to an AI coach who asks the right questions? That I actually do.
            </p>
            <p className="text-muted-foreground mb-4">
              It takes about 2 minutes. You tell it what happened in your session.
              It asks follow-up questions. Over time, it spots patterns you miss.
              Which players keep coming up. What challenges repeat. Whether your energy
              is dropping before you notice.
            </p>
            <p className="text-muted-foreground">
              Give it a try. The free tier lets you reflect twice a day. If it works for you, Pro removes the limits.
            </p>
            <p className="font-medium mt-4">Kev</p>
          </CardContent>
        </Card>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How it works</h2>
          <div className="grid gap-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Finish your session</p>
                <p className="text-sm text-muted-foreground">
                  Open the app on your phone. Type or use a voice note to tell it what happened.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">AI asks the right questions</p>
                <p className="text-sm text-muted-foreground">
                  What worked? What didn&apos;t? Who stood out? It guides you through a proper reflection without you having to think about what to write.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Patterns emerge over time</p>
                <p className="text-sm text-muted-foreground">
                  After a few weeks, the AI shows you what themes keep appearing. Which players need attention. Where your coaching is growing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">What FCA coaches say</h2>
          <div className="grid gap-4">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <p className="text-muted-foreground mb-3">&quot;{t.quote}&quot;</p>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* What you get */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">What you get (free)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="font-medium mb-1">2 reflections a day</p>
              <p className="text-sm text-muted-foreground">Enough to build the habit</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-medium mb-1">Guided prompts</p>
              <p className="text-sm text-muted-foreground">AI asks the questions you should be asking yourself</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-medium mb-1">Mood and energy tracking</p>
              <p className="text-sm text-muted-foreground">Spot burnout before it hits</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-medium mb-1">7 days of history</p>
              <p className="text-sm text-muted-foreground">Review your recent sessions</p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Pro ($7.99/mo) adds unlimited reflections, voice notes, AI insights, and full history.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Reflecting Free
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            No credit card required. Takes 30 seconds to sign up.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Pro is $7.99/month with a 7-day free trial. But the free version is enough to see if it works for you.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
