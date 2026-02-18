import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"

export const metadata: Metadata = {
  title: "Tennis Coaching Reflection App - Coach Journal & Development",
  description: "Reflect on your tennis coaching with AI-powered guided prompts. Track player technical development, analyse lessons and group sessions, and export CPD evidence for LTA qualifications. Free to start.",
  alternates: {
    canonical: "https://coachreflection.com/coaching-reflection-tennis",
  },
  openGraph: {
    title: "Tennis Coaching Reflection App - Coach Journal & Development | CoachReflection",
    description: "AI-powered tennis coaching journal with guided reflection prompts, player tracking and CPD export for tennis coaches at every level.",
    url: "https://coachreflection.com/coaching-reflection-tennis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tennis Coaching Reflection App - Coach Journal & Development | CoachReflection",
    description: "AI-powered tennis coaching journal with guided prompts, player development tracking and CPD export.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does CoachReflection help tennis coaches specifically?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CoachReflection adapts its prompts and terminology to tennis. After an individual lesson it asks about technical work on serve, groundstrokes or volleys, and how the player responded to coaching cues. After a group session it focuses on drill engagement, competition formats and managing different ability levels. The AI understands the difference between coaching a one-to-one lesson and running a junior group."
      }
    },
    {
      "@type": "Question",
      "name": "Can I track individual player development across lessons?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Every time you mention a player in your reflections the AI automatically tracks them. For tennis this is particularly valuable because you often coach the same players week after week. Over months you can see how a player's serve technique discussions have evolved, whether forehand concerns are resolving, or when you last reflected on their net play. The player timeline gives you a complete coaching picture without manual tagging."
      }
    },
    {
      "@type": "Question",
      "name": "Does it support LTA coaching qualifications and CPD?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CoachReflection includes a CPD export feature that formats your reflections into evidence suitable for LTA coaching pathway requirements. Whether you are working towards your LTA Level 1 Assistant, Level 2, Level 3 or beyond, your structured reflections demonstrate the ongoing professional development that the LTA expects. Exported reports show reflection frequency, coaching themes and development areas."
      }
    },
    {
      "@type": "Question",
      "name": "Is it useful for coaching junior tennis players?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. Junior tennis coaching involves managing players at different stages of physical and technical development, often within the same group session. CoachReflection helps you track each junior across lessons, reflect on whether your sessions are age-appropriate, and spot which players might need more individual attention. The AI prompts consider engagement and enjoyment alongside technical progression."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use voice notes between lessons?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Tennis coaches often have a short gap between lessons, sometimes just enough time to collect balls and reset the court. Voice notes let you speak your observations in that window. The AI converts your recording into a structured reflection automatically, so you capture your thoughts on each lesson before the next player arrives."
      }
    }
  ]
}

export default function TennisCoachingReflectionPage() {
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
              Tennis Coaching Reflection App
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Capture your coaching observations after every lesson and group session.
              AI-guided reflection prompts, player development tracking and CPD export
              built specifically for tennis coaches.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Individual lessons, group sessions, junior development, match preparation and LTA CPD
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

          {/* Why Tennis Coaches Need Reflection */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Why Tennis Coaches Need Structured Reflection
              </h2>
              <div className="bg-card rounded-2xl border p-8 md:p-12">
                <div className="space-y-4 text-muted-foreground text-lg">
                  <p>
                    Tennis coaching is unique. You might teach six individual lessons in a day, each
                    with a different player working on different technical areas. Then you run a group
                    session with mixed abilities, followed by a squad practice focused on match play.
                    By the end of the day you have made hundreds of observations about technique,
                    tactics and player development. Most of them are gone by morning.
                  </p>
                  <p>
                    The one-to-one nature of tennis coaching makes this particularly costly. When you
                    see a player once a week, the continuity between lessons depends entirely on your
                    memory. What did you work on last time? What was the coaching cue that clicked?
                    Where did they struggle? Without a record, each lesson risks starting from scratch
                    rather than building on genuine progress.
                  </p>
                  <p>
                    An AI coaching journal solves this. It captures your reflections through guided
                    prompts adapted to tennis, tracks every player you mention across lessons, and
                    connects your observations over weeks and months. When a player walks on court,
                    you can see exactly where you left off and what to focus on next.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works for Tennis */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How It Works for Tennis Coaches
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Tennis-Specific Prompts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      After an individual lesson the AI asks about technical work on serve, groundstrokes,
                      volleys or movement. After a group session it focuses on drill engagement, competition
                      formats and managing different ability levels. The prompts adapt to whether you are
                      coaching a beginner or preparing a competitive player for a tournament.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Lesson-to-Lesson Continuity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI tracks your reflections on each player across lessons. Before a session you
                      can review what you worked on last time, what coaching cues were effective, and what
                      the player struggled with. This continuity is what separates good coaching from
                      great coaching, and it happens automatically from your reflections.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-emerald-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Technical Development Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Mention players naturally in your reflections and the AI tracks their technical
                      journey. See how discussions about a player&apos;s serve have evolved, whether
                      forehand grip concerns are resolving, or when you last reflected on their movement
                      to the net. The timeline tells the development story.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Tennis-Specific Use Cases */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Built for Every Part of Tennis Coaching
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Individual Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reflect on each lesson individually. What technical area did you focus on? How
                      did the player respond to your coaching cues? What would you prioritise next
                      time? The AI creates a continuous development thread for each player so nothing
                      is lost between weekly lessons.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Group Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Group sessions bring their own challenges: managing different ability levels,
                      keeping everyone engaged and ensuring each player gets attention. Reflect on how
                      your drill structures worked, which players thrived in competition formats and
                      where the energy dropped. The AI helps you design better group sessions over time.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Serve and Groundstroke Development</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track how your technical coaching evolves with each player. Reflect on the
                      specific cues and drills you used for serve technique, forehand and backhand
                      development, and volley work. Over time the AI shows you which approaches
                      produce the best results and where players tend to plateau.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Match Preparation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reflect on how you prepare competitive players for matches. Log observations
                      about tactical awareness, mental resilience and how players handle pressure
                      points. After a tournament, capture what you observed about their performance
                      under competition conditions compared to practice.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Junior Development</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coaching junior tennis players means adapting to different physical stages,
                      attention spans and motivations. Reflect on how sessions land with different
                      age groups, whether your activities balance fun with learning, and which juniors
                      are showing the progression that suggests they are ready for more challenge.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>LTA CPD Evidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Export your reflections as formatted CPD evidence for LTA coaching qualifications.
                      Whether you are progressing through LTA Level 1 Assistant, Level 2, Level 3 or
                      the Performance pathway, your reflection journal demonstrates the structured
                      professional development that the LTA expects to see from its coaches.
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
                  Capture Thoughts Between Lessons
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Voice Notes on Court</h3>
                    <p className="text-muted-foreground mb-6">
                      Tennis coaches often have just minutes between lessons. Enough time to collect
                      balls and reset the court, but not enough to sit down and type. Voice notes let
                      you speak your observations while tidying up. The AI converts your recording into
                      a structured reflection so you capture each lesson before the next player arrives.
                    </p>
                    <h3 className="font-semibold mb-3">Session Plan Upload</h3>
                    <p className="text-muted-foreground">
                      Upload a photo of your lesson plan or drill sheet. The AI extracts your planned
                      objectives and activities, then asks you to reflect on what actually happened.
                      Did the player progress as you expected? Did you need to adapt the plan? This
                      comparison between intention and reality drives genuine improvement.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Energy and Workload Tracking</h3>
                    <p className="text-muted-foreground mb-6">
                      Tennis coaches can deliver six or more hours of on-court coaching in a day. Log
                      your mood and energy after each block of lessons and the AI tracks your wellbeing
                      across the week. It flags when your energy is consistently low at certain times,
                      helping you structure your timetable to maintain coaching quality throughout the day.
                    </p>
                    <h3 className="font-semibold mb-3">AI Chat Companion</h3>
                    <p className="text-muted-foreground">
                      Ask the AI about any player you coach. When did you last work on their backhand?
                      What has their serve development looked like over the past two months? What themes
                      keep appearing in your group session reflections? The AI has read every entry and
                      surfaces the connections you need.
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
                    <CardTitle className="text-base">How does CoachReflection help tennis coaches specifically?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      CoachReflection adapts its prompts and terminology to tennis. After an individual
                      lesson it asks about technical work on serve, groundstrokes or volleys, and how the
                      player responded to coaching cues. After a group session it focuses on drill engagement,
                      competition formats and managing different ability levels.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I track individual player development across lessons?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. Every time you mention a player in your reflections the AI automatically tracks
                      them. Over months you can see how a player&apos;s serve technique discussions have
                      evolved, whether forehand concerns are resolving, or when you last reflected on their
                      net play. The player timeline gives you a complete coaching picture.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Does it support LTA coaching qualifications and CPD?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      CoachReflection includes a CPD export feature that formats your reflections into
                      evidence suitable for LTA coaching pathway requirements. Whether you are working
                      towards your LTA Level 1 Assistant, Level 2, Level 3 or the Performance pathway,
                      your reflections demonstrate ongoing professional development.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Is it useful for coaching junior tennis players?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Absolutely. Junior tennis coaching involves managing players at different stages of
                      physical and technical development, often within the same group session. Coach
                      Reflection helps you track each junior across lessons, reflect on whether your
                      sessions are age-appropriate, and spot which players might need more attention.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I use voice notes between lessons?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. Tennis coaches often have a short gap between lessons, sometimes just enough
                      time to collect balls and reset the court. Voice notes let you speak your observations
                      in that window. The AI converts your recording into a structured reflection so you
                      capture each lesson before the next player arrives.
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
                <CardTitle className="text-2xl">Start Your Tennis Coaching Journal Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-6">
                  Join tennis coaches who are using AI-powered reflection to build lesson continuity,
                  track player development and generate CPD evidence across every term and season.
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
