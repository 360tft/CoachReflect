import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"

export const metadata: Metadata = {
  title: "Basketball Coaching Reflection App - Coach Journal & CPD",
  description: "Reflect on your basketball coaching with AI-powered guided prompts. Track player development across practice sessions and games, analyse plays and rotations, and export CPD evidence. For youth and senior basketball coaches. Free to start.",
  alternates: {
    canonical: "https://coachreflection.com/coaching-reflection-basketball",
  },
  openGraph: {
    title: "Basketball Coaching Reflection App - Coach Journal & CPD | CoachReflection",
    description: "AI-powered basketball coaching journal with guided reflection prompts, player tracking and CPD export for basketball coaches at every level.",
    url: "https://coachreflection.com/coaching-reflection-basketball",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Basketball Coaching Reflection App - Coach Journal & CPD | CoachReflection",
    description: "AI-powered basketball coaching journal with guided prompts, player development tracking and CPD export.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does CoachReflection help basketball coaches?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CoachReflection adapts its prompts to basketball. After a practice session it asks about shooting drills, defensive rotations, play execution and player engagement. After a game it focuses on tactical adjustments, substitution patterns and how players performed under pressure. The AI understands basketball terminology and structures its questions around how basketball coaches actually work."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use it to review game film alongside my reflections?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CoachReflection is designed to complement your game film review process. After watching film you can log your observations and the AI connects them with your post-game reflections and practice notes. Over time this creates a complete picture linking what you planned in practice, what happened in the game, and what you noticed on film."
      }
    },
    {
      "@type": "Question",
      "name": "Does it support Basketball England or USA Basketball coaching pathways?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. CoachReflection includes a CPD export feature that formats your reflections into evidence suitable for coaching qualification requirements. Whether you are on the Basketball England coaching pathway or following USA Basketball guidelines, your structured reflections demonstrate ongoing professional development that governing bodies expect to see."
      }
    },
    {
      "@type": "Question",
      "name": "Is it useful for youth basketball coaching?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. Youth basketball coaching involves managing large rosters, developing fundamental skills and keeping young players engaged. CoachReflection helps you track each player across sessions, spot who is being overlooked, reflect on whether your drills are age-appropriate, and monitor your own coaching energy across a busy season of practices and tournaments."
      }
    },
    {
      "@type": "Question",
      "name": "How does player tracking work for basketball?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "When you mention players in your reflections the AI automatically tracks them. You do not need to tag anyone manually. Over a season you can see which players you mention most, in what context, and how your observations about them change. This is particularly useful for tracking development of shooting form, defensive habits or leadership qualities across the roster."
      }
    }
  ]
}

export default function BasketballCoachingReflectionPage() {
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
            <img src="/logo.png" alt="CoachReflection" width={240} height={40} className="h-10 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="CoachReflection" width={240} height={40} className="h-10 w-auto hidden dark:block" />
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
              Basketball Coaching Reflection App
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Turn your post-practice thoughts and game observations into structured coaching
              insights. AI-guided reflection prompts, player development tracking and CPD export
              built for basketball coaches.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Practice sessions, game review, youth development and coaching pathway CPD
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

          {/* Why Basketball Coaches Need Reflection */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Why Basketball Coaches Need Structured Reflection
              </h2>
              <div className="bg-card rounded-2xl border p-8 md:p-12">
                <div className="space-y-4 text-muted-foreground text-lg">
                  <p>
                    Basketball moves fast, and so does a coaching session. You run through shooting
                    drills, defensive sets, transition plays and scrimmages in the space of ninety
                    minutes. By the time players leave the court you have made dozens of observations
                    about individual technique, team execution and areas that need work. Most of
                    those observations never get written down.
                  </p>
                  <p>
                    Game days are even more intense. You are making substitution decisions, calling
                    plays, adjusting defensive schemes and managing player emotions in real time. The
                    mental load is enormous, and the post-game window where your observations are
                    sharpest is often consumed by conversations with players, parents or other coaches.
                  </p>
                  <p>
                    An AI coaching journal captures those fleeting observations and turns them into
                    lasting insights. It asks basketball-specific questions about what happened, connects
                    your reflections across the season, and helps you see the coaching patterns that are
                    invisible in the moment. Over time, your reflections become a development tool that
                    makes you measurably better at what you do.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works for Basketball */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How It Works for Basketball Coaches
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Basketball-Specific Prompts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      After practice the AI asks about shooting form, defensive rotations, play
                      execution and player engagement. After games it focuses on tactical decisions,
                      substitution patterns, offensive and defensive efficiency, and how the team
                      handled momentum shifts. The prompts match the situation.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Season-Long Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Basketball seasons are packed with practices and games. The AI analyses your
                      reflections across the full season to surface patterns. Are you consistently
                      noting the same defensive breakdown? Has a player&apos;s shooting confidence
                      changed? Are your practice plans translating to game performance? The insights
                      appear automatically.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-emerald-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Roster-Wide Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Mention players naturally in your reflections and the AI tracks them over time.
                      See development arcs across the roster. Identify which players are getting the
                      most attention in your reflections and which might be slipping under the radar.
                      Every player on the team deserves to be noticed.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Basketball-Specific Use Cases */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Built for Every Part of Basketball Coaching
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Practice Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reflect on how drills went, whether players grasped the coaching points and
                      what you would change for next time. Track whether your work on shooting form,
                      ball handling or defensive positioning is producing results across multiple
                      sessions. Note which drill structures keep players engaged and which lose them.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Game Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Capture your immediate post-game observations before watching film. Reflect on
                      your tactical decisions, rotation choices and how the team executed what you
                      practised. Then add to your reflections after film review. The AI connects your
                      in-the-moment thoughts with your detailed analysis to build a complete picture.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Offensive and Defensive Sets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track how your offensive plays and defensive schemes develop over the season.
                      Reflect on which sets are working, which need adjustment and how players are
                      adapting to new concepts. The AI identifies when you keep returning to the same
                      issues, suggesting it might be time for a different approach.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Youth Development</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Youth basketball requires balancing skill development with enjoyment and
                      participation. Reflect on whether all players are getting court time, how you
                      are developing fundamentals at each age group, and whether your sessions are
                      appropriate for the level. Track individual progress across an entire youth
                      programme.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Player Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Basketball squads have complex dynamics. Reflect on playing time distribution,
                      player attitudes, leadership development and how individuals respond to different
                      coaching approaches. The AI helps you spot patterns in player behaviour that
                      you might not notice in the daily flow of practices and games.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Coaching Pathway CPD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Export your reflections as formatted CPD evidence for Basketball England coaching
                      qualifications or USA Basketball coaching development. Your reflection journal
                      demonstrates the structured, ongoing professional development that governing
                      bodies expect from coaches progressing through their pathways.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Voice Notes and Tools */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
                  Capture Thoughts While They Are Fresh
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Voice Notes After Practice</h3>
                    <p className="text-muted-foreground mb-6">
                      The window after practice is short. Players are leaving, equipment needs
                      clearing and you have other commitments waiting. Voice notes let you speak
                      your observations while walking to the car. The AI converts your recording
                      into a structured reflection without you needing to type a word.
                    </p>
                    <h3 className="font-semibold mb-3">Session Plan Upload</h3>
                    <p className="text-muted-foreground">
                      Upload a photo of your practice plan, whether it is a detailed whiteboard
                      diagram or notes on your phone. The AI extracts your planned drills and
                      objectives, then asks you to reflect on what actually happened. This creates
                      a natural comparison between intention and reality.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Energy and Burnout Tracking</h3>
                    <p className="text-muted-foreground mb-6">
                      Basketball seasons are demanding. Multiple practices a week, games at weekends,
                      tournaments and travel. Log your mood and energy after each session and the AI
                      tracks your wellbeing across the season. It flags when your energy is dropping
                      consistently, helping you manage your schedule before burnout sets in.
                    </p>
                    <h3 className="font-semibold mb-3">AI Chat Companion</h3>
                    <p className="text-muted-foreground">
                      Ask the AI to summarise your last ten practices, identify recurring themes in
                      your game reflections, or suggest what to focus on in your next session. It
                      has read every reflection you have written and can surface connections you
                      would never spot on your own.
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
                    <CardTitle className="text-base">How does CoachReflection help basketball coaches?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      CoachReflection adapts its prompts to basketball. After a practice it asks about
                      shooting drills, defensive rotations, play execution and player engagement. After
                      a game it focuses on tactical adjustments, substitution patterns and how players
                      performed under pressure. The AI understands basketball terminology and structures
                      its questions around how basketball coaches actually work.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I use it to review game film alongside my reflections?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      CoachReflection is designed to complement your game film review process. After
                      watching film you can log your observations and the AI connects them with your
                      post-game reflections and practice notes. Over time this creates a complete picture
                      linking what you planned in practice, what happened in the game, and what you
                      noticed on film.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Does it support Basketball England or USA Basketball coaching pathways?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. CoachReflection includes a CPD export feature that formats your reflections
                      into evidence suitable for coaching qualification requirements. Whether you are on
                      the Basketball England coaching pathway or following USA Basketball guidelines, your
                      structured reflections demonstrate ongoing professional development.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Is it useful for youth basketball coaching?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Absolutely. Youth basketball coaching involves managing large rosters, developing
                      fundamental skills and keeping young players engaged. CoachReflection helps you
                      track each player across sessions, spot who is being overlooked, and reflect on
                      whether your drills are age-appropriate.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How does player tracking work for basketball?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      When you mention players in your reflections the AI automatically tracks them. You
                      do not need to tag anyone manually. Over a season you can see which players you
                      mention most, in what context, and how your observations about them change. This is
                      particularly useful for tracking development of shooting form, defensive habits or
                      leadership qualities across the roster.
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
                <CardTitle className="text-2xl">Start Your Basketball Coaching Journal Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-6">
                  Join basketball coaches who are using AI-powered reflection to sharpen their
                  practice planning, track player development and build CPD evidence across the season.
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
