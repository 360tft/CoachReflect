import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"

export const metadata: Metadata = {
  title: "Cricket Coaching Reflection App - Umpire & Coach Journal | Coach Reflection",
  description: "Reflect on your cricket coaching with AI-powered guided prompts. Track player development across net sessions and match days, log umpire reflections, and export CPD evidence for ECB qualifications. Free to start.",
  alternates: {
    canonical: "https://coachreflection.com/coaching-reflection-cricket",
  },
  openGraph: {
    title: "Cricket Coaching Reflection App - Umpire & Coach Journal | Coach Reflection",
    description: "AI-powered cricket coaching journal with guided reflection prompts, player tracking and CPD export for cricket coaches and umpires.",
    url: "https://coachreflection.com/coaching-reflection-cricket",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cricket Coaching Reflection App - Umpire & Coach Journal | Coach Reflection",
    description: "AI-powered cricket coaching journal with guided prompts, player development tracking and CPD export.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does Coach Reflection help cricket coaches specifically?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Coach Reflection adapts its prompts and terminology to cricket. After a net session you might reflect on bowling actions, batting technique or fielding positions. After a match day the AI asks about tactical decisions, bowling changes and how players handled pressure. It understands the difference between coaching in the nets and coaching during a match, and adjusts its questions accordingly."
      }
    },
    {
      "@type": "Question",
      "name": "Can cricket umpires use Coach Reflection for self-reflection?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Umpires can use Coach Reflection to log reflections after matches, reviewing decisions on LBW appeals, run-out judgements, no-ball calls and player management. The AI tracks patterns in your officiating over time, helping you identify areas where your decision-making is strong and where it needs attention. This structured reflection supports umpire development pathways."
      }
    },
    {
      "@type": "Question",
      "name": "Does it support ECB coaching qualifications and CPD?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Coach Reflection includes a CPD export feature that formats your reflections into evidence suitable for ECB coaching pathway requirements. Whether you are working towards your ECB Foundation, Level 2 or beyond, your reflections demonstrate ongoing professional development. The exported reports show reflection frequency, coaching themes and development areas."
      }
    },
    {
      "@type": "Question",
      "name": "Can I track individual player development across a cricket season?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Every time you mention a player in your reflections the AI automatically tracks them. Over a season you can see how a batter's technique discussions evolve, whether a bowler's action concerns are resolving, or if a fielder is being mentioned less frequently. The player timeline gives you a complete development picture without any manual tagging."
      }
    },
    {
      "@type": "Question",
      "name": "Is Coach Reflection useful for junior cricket coaching?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. Junior cricket coaching involves tracking large groups of young players at different stages of development. Coach Reflection helps you remember observations about each player across sessions, spot which juniors might be getting overlooked, and reflect on how you are adapting your coaching to different age groups and ability levels. The AI prompts are particularly useful for thinking about engagement and enjoyment alongside technical development."
      }
    }
  ]
}

export default function CricketCoachingReflectionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Coach Reflection" width={240} height={40} className="h-10 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="Coach Reflection" width={240} height={40} className="h-10 w-auto hidden dark:block" />
            <span className="text-sm text-muted-foreground">by 360TFT</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </header>

        <article>
          {/* Hero */}
          <section className="container mx-auto px-4 py-20 text-center bg-gradient-to-b from-amber-50/30 to-transparent dark:from-amber-950/10 dark:to-transparent">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Cricket Coaching Reflection App
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Capture what happens in the nets and on match days before it fades. AI-guided
              reflection prompts, player development tracking and CPD export built specifically
              for cricket coaches and umpires.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Net sessions, match days, junior development, umpire reflection and ECB CPD
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free tier available. No credit card required.
            </p>
          </section>

          {/* Why Cricket Coaches Need Reflection */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Why Cricket Coaches Need Structured Reflection
              </h2>
              <div className="bg-card rounded-2xl border p-8 md:p-12">
                <div className="space-y-4 text-muted-foreground text-lg">
                  <p>
                    Cricket coaching is full of small observations that add up. A batter who keeps
                    getting out to the same delivery. A bowler whose run-up is shortening without
                    realising. A fielder who positions themselves well but hesitates on the throw.
                    You notice these things during a session, but by the time you get home they have
                    blurred into a general sense of how it went.
                  </p>
                  <p>
                    The nature of cricket makes this worse. Net sessions can involve eight or ten
                    players rotating through batting, bowling and catching drills simultaneously.
                    Match days demand attention on tactics, bowling changes, field placements and
                    individual performances across hours of play. There is simply too much happening
                    to hold it all in your head.
                  </p>
                  <p>
                    An AI coaching journal gives you a place to capture those observations immediately.
                    Guided prompts ask the right questions for cricket - about technique, tactical
                    decisions, player confidence and session structure. Over weeks and months, the AI
                    connects your reflections to show you patterns you would never spot from memory alone.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works for Cricket */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How It Works for Cricket Coaches
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Cricket-Specific Prompts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      After a net session the AI asks about batting technique, bowling accuracy,
                      fielding drills and how players responded to coaching points. After a match
                      it focuses on tactical decisions, bowling changes and how the team handled
                      pressure situations. The prompts match the context.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Season-Long Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Cricket seasons are long. The AI analyses your reflections across weeks and
                      months to surface patterns. Are you consistently noting the same technical
                      issue with a player? Has your approach to net sessions shifted? Are certain
                      match situations causing repeated concern? These insights emerge automatically.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-emerald-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Player Development Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Mention players naturally in your reflections and the AI tracks them over time.
                      See how a young batter&apos;s confidence develops across the season, whether a
                      bowler&apos;s action concerns are improving, or which squad members are being
                      mentioned less often than they should be.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Cricket-Specific Use Cases */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Built for Every Part of Cricket Coaching
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Net Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reflect on how batting and bowling groups performed. Track whether coaching
                      points on grip, stance, backlift or bowling action are being absorbed across
                      sessions. Note which players need more individual attention and which drills
                      produced the best engagement.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Match Day Reflection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Capture your thoughts on team selection, batting order decisions, bowling
                      changes and field placements. Reflect on how players handled the pressure of
                      competition compared to training. The AI helps you connect match performance
                      back to what you have been working on in the nets.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Fielding and Fitness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Log observations on catching drills, throwing accuracy and ground fielding.
                      Track how fitness and conditioning work is translating to match readiness.
                      The AI spots whether certain players are consistently struggling with
                      specific fielding positions or fitness demands.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Umpire Self-Reflection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Cricket umpires face complex decisions under pressure. Use Coach Reflection
                      to review your LBW calls, caught-behind decisions, wide and no-ball judgements
                      and player management. Build a record of your officiating development that
                      supports your progression through umpiring pathways.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Junior Development</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coaching junior cricketers means balancing technical development with enjoyment
                      and engagement. Reflect on how sessions landed with different age groups, which
                      activities held attention and where young players showed progress. Track individual
                      development across an entire youth programme.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>ECB CPD Evidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Export your reflections as formatted CPD evidence for ECB coaching qualifications.
                      Whether you are working through the ECB Foundation, Core Coach, Advanced Coach
                      or specialist pathways, your reflection journal demonstrates the ongoing
                      professional development that the ECB expects to see.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Voice Notes for Cricket */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
                  Capture Thoughts While They Are Fresh
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Voice Notes After the Session</h3>
                    <p className="text-muted-foreground mb-6">
                      Cricket sessions often end with equipment to pack away, parents arriving and
                      players wanting a word. Typing up reflections is not realistic in that moment.
                      Voice notes let you speak your thoughts while packing the kit bag. The AI
                      processes your recording into a structured reflection automatically.
                    </p>
                    <h3 className="font-semibold mb-3">Session Plan Upload</h3>
                    <p className="text-muted-foreground">
                      Upload a photo of your session plan - whether it is a detailed coaching manual
                      page or notes scribbled on the back of a scorecard. The AI extracts your planned
                      objectives and drills, then asks you to reflect on what actually happened versus
                      what you intended.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Seasonal Pattern Detection</h3>
                    <p className="text-muted-foreground mb-6">
                      Cricket has a natural rhythm. Pre-season nets, early season matches, mid-season
                      intensity and end-of-season fatigue all affect your coaching and your players.
                      The AI tracks your mood, energy and session quality across the season to help
                      you plan better and avoid burnout during the busiest periods.
                    </p>
                    <h3 className="font-semibold mb-3">AI Chat Companion</h3>
                    <p className="text-muted-foreground">
                      Ask the AI to summarise how a particular player has developed this season, identify
                      your most common coaching themes, or suggest what to focus on in the next net
                      session. It has read every reflection you have written and remembers the details
                      you have forgotten.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How does Coach Reflection help cricket coaches specifically?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coach Reflection adapts its prompts and terminology to cricket. After a net session
                      you might reflect on bowling actions, batting technique or fielding positions. After
                      a match day the AI asks about tactical decisions, bowling changes and how players
                      handled pressure. It understands the difference between coaching in the nets and
                      coaching during a match.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can cricket umpires use Coach Reflection for self-reflection?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. Umpires can log reflections after matches, reviewing decisions on LBW appeals,
                      run-out judgements, no-ball calls and player management. The AI tracks patterns in
                      your officiating over time, helping you identify areas where your decision-making
                      is strong and where it needs attention.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Does it support ECB coaching qualifications and CPD?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coach Reflection includes a CPD export feature that formats your reflections into
                      evidence suitable for ECB coaching pathway requirements. Whether you are working
                      towards your ECB Foundation, Core Coach or Advanced Coach qualification, your
                      reflections demonstrate ongoing professional development.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I track individual player development across a cricket season?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. Every time you mention a player in your reflections the AI automatically tracks
                      them. Over a season you can see how a batter&apos;s technique discussions evolve,
                      whether a bowler&apos;s action concerns are resolving, or if a fielder is being
                      mentioned less frequently than they should be.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Is Coach Reflection useful for junior cricket coaching?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Absolutely. Junior cricket coaching involves tracking large groups of young players
                      at different stages of development. Coach Reflection helps you remember observations
                      about each player across sessions, spot which juniors might be getting overlooked,
                      and reflect on how you are adapting your coaching to different age groups.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="container mx-auto px-4 py-20 text-center">
            <Card className="bg-primary text-primary-foreground border-0 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Start Your Cricket Coaching Journal Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-6">
                  Join cricket coaches and umpires who are using AI-powered reflection to improve
                  their coaching, track player development and build CPD evidence throughout the season.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup">
                    <Button size="lg" className="!bg-white !text-gray-900 hover:!bg-gray-100">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                      Read the Blog
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </article>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}
