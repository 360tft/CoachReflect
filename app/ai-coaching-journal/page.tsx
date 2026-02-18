import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"

export const metadata: Metadata = {
  title: "AI Coaching Journal - Become a Better Coach After Every Session",
  description: "Become a better coach with an AI-powered coaching journal. Reflect for 2 minutes, the AI shows you what's working. Voice notes, pattern detection, player tracking and CPD export. Free to start.",
  alternates: {
    canonical: "https://coachreflection.com/ai-coaching-journal",
  },
  openGraph: {
    title: "AI Coaching Journal - Become a Better Coach | CoachReflection",
    description: "Become a better coach with an AI-powered journal. 2-minute reflections, pattern detection, player tracking and CPD export for sports coaches.",
    url: "https://coachreflection.com/ai-coaching-journal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Coaching Journal - Become a Better Coach | CoachReflection",
    description: "AI-powered coaching journal. 2-minute reflections show you what's working and what isn't. Pattern detection and player tracking for sports coaches.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is an AI coaching journal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An AI coaching journal is a digital reflection tool that uses artificial intelligence to help sports coaches capture, analyse and learn from their coaching sessions. Unlike a paper notebook, CoachReflection asks you guided questions after each session, detects patterns across your reflections over time, tracks individual player mentions and progress, and generates actionable insights. It turns scattered post-session thoughts into structured growth opportunities."
      }
    },
    {
      "@type": "Question",
      "name": "How is an AI coaching journal different from keeping notes in a notebook?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A notebook stores your thoughts but does nothing with them. An AI coaching journal actively works with your reflections. It asks structured questions based on coaching best practice, spots recurring themes you might miss (like consistently struggling with transitions or always noting the same player), tracks your mood and energy to flag burnout risk, and generates personalised suggestions for improvement. It is like having a mentor who reads every entry and remembers everything."
      }
    },
    {
      "@type": "Question",
      "name": "Which sports does CoachReflection support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CoachReflection supports football, rugby, basketball, hockey, tennis, cricket, volleyball, baseball, swimming, athletics, gymnastics, martial arts and more. The AI adapts its terminology, prompts and insights to your sport. A football coach gets questions about formations and player positions, while a swimming coach gets prompts about stroke technique and split times."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use voice notes instead of typing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. CoachReflection includes a voice recording feature so you can capture your thoughts immediately after a session while they are fresh. Speak naturally about how the session went and the AI processes your voice notes into structured reflections. This is particularly useful on the training ground when typing is not practical."
      }
    },
    {
      "@type": "Question",
      "name": "Is CoachReflection free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, CoachReflection offers a free tier that includes basic reflection logging, guided prompts and session history. Pro users get AI-powered pattern detection, player tracking, mood and energy analytics, voice notes, session plan upload with AI extraction, CPD export and unlimited reflections. Pricing starts from $7.99 per month."
      }
    }
  ]
}

export default function AiCoachingJournalPage() {
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
              AI-Powered Coaching Journal for Sports Coaches
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Transform your post-session thoughts into actionable insights. Guided reflection
              prompts, AI pattern detection, player tracking and CPD export - everything you
              need to grow as a coach.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Football, Rugby, Basketball, Tennis, Swimming, Cricket and 10+ more sports
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

          {/* Why Coaches Need AI-Powered Reflection */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Why Coaches Need AI-Powered Reflection
              </h2>
              <div className="bg-card rounded-2xl border p-8 md:p-12">
                <div className="space-y-4 text-muted-foreground text-lg">
                  <p>
                    Most coaches know that reflection is important. After a session, your mind is full
                    of observations: what worked, what did not, which players stood out, what you would
                    change next time. But those thoughts rarely make it anywhere useful. They fade by
                    the next morning, replaced by the demands of the next session.
                  </p>
                  <p>
                    Even coaches who keep notes often end up with scattered observations in notebooks,
                    phone notes or voice memos that are never revisited. The patterns that could transform
                    your coaching - the recurring challenges, the subtle improvements, the players who
                    need attention - stay hidden in a pile of unstructured text.
                  </p>
                  <p>
                    An AI coaching journal changes this. It captures your reflections through guided
                    questions, analyses them over time to spot patterns you would miss, tracks individual
                    player development, and turns your experience into structured growth. It is the
                    difference between having thoughts and having insights.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How the AI Coaching Journal Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Guided Prompts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      After each session, answer structured questions designed around coaching best
                      practice. What went well? What would you change? How did specific players
                      respond? The prompts guide your thinking without restricting it.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg">AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI analyses your reflections over time to surface patterns. Recurring
                      challenges, improvement trends, declining areas and personalised suggestions
                      appear automatically as you build a body of reflections.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-emerald-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Pattern Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      See trends in your coaching over weeks and months. Track your mood and energy
                      levels to spot burnout early. Identify which session types produce the best
                      outcomes and where you consistently struggle.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Sports Covered */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                Built for Every Sport
              </h2>
              <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                CoachReflection adapts its prompts, terminology and insights to your sport.
                The AI understands the difference between coaching football and coaching swimming.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  'Football', 'Rugby', 'Basketball', 'Hockey', 'Tennis',
                  'Cricket', 'Volleyball', 'Baseball', 'Swimming', 'Athletics',
                  'Gymnastics', 'Martial Arts', 'Netball', 'Handball',
                ].map((sport) => (
                  <span
                    key={sport}
                    className="inline-flex items-center px-4 py-2 bg-card rounded-full text-sm border font-medium"
                  >
                    {sport}
                  </span>
                ))}
                <span className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm border border-primary/20 font-medium">
                  + More
                </span>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Features That Help You Grow
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Voice Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Capture your thoughts by speaking immediately after a session. The AI processes
                      your voice recording into a structured reflection. No typing needed on the
                      training ground or at the side of the pitch.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Session Plan Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Upload a photo of your session plan - handwritten or digital. AI vision
                      extracts objectives, drills and coaching points automatically. Then reflect
                      on what actually happened versus what you planned.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Player Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI tracks every player you mention across your reflections. See which
                      players appear frequently, what context they are mentioned in, and how their
                      progress develops over time. Spot the quiet ones you might be overlooking.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>CPD Export</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Export your reflections as evidence for your Continuing Professional Development
                      portfolio. Formatted reports show your reflection practice, coaching themes and
                      development areas, suitable for federation CPD requirements.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Mood and Energy Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Log your mood and energy level after each session. Over time, the AI identifies
                      patterns - are you consistently drained after Thursday sessions? Does your mood
                      correlate with session quality? Spot burnout before it hits.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>AI Chat Companion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Chat with an AI that has read all your reflections. Ask it to summarise your
                      last month, identify your biggest coaching challenge, or suggest what to focus
                      on next. It knows your coaching journey better than anyone.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Player Tracking Deep Dive */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
                  Player Tracking and Development
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Automatic Player Detection</h3>
                    <p className="text-muted-foreground mb-6">
                      When you mention players in your reflections, the AI automatically tracks them.
                      No manual tagging needed. Just write naturally about your session and the AI
                      identifies who you are talking about.
                    </p>
                    <h3 className="font-semibold mb-3">Development Timeline</h3>
                    <p className="text-muted-foreground">
                      See how each player&apos;s mentions change over time. Is a player being mentioned
                      more positively? Are they appearing less frequently, suggesting they might be
                      getting overlooked? The timeline tells the story.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Context Awareness</h3>
                    <p className="text-muted-foreground mb-6">
                      The AI does not just count mentions - it understands context. It knows the
                      difference between &quot;Jake scored a brilliant goal&quot; and &quot;Jake struggled
                      with confidence today&quot;. This contextual tracking gives you genuine player
                      development insights.
                    </p>
                    <h3 className="font-semibold mb-3">Observation Prompts</h3>
                    <p className="text-muted-foreground">
                      If the AI notices you have not mentioned certain players recently, it gently
                      prompts you. This helps ensure every player in your squad gets attention, not
                      just the standout performers.
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
                    <CardTitle className="text-base">What is an AI coaching journal?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      An AI coaching journal is a digital reflection tool that uses artificial intelligence
                      to help sports coaches capture, analyse and learn from their coaching sessions. Unlike
                      a paper notebook, CoachReflection asks you guided questions after each session, detects
                      patterns across your reflections over time, tracks individual player mentions and progress,
                      and generates actionable insights.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How is an AI coaching journal different from keeping notes in a notebook?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A notebook stores your thoughts but does nothing with them. An AI coaching journal
                      actively works with your reflections. It asks structured questions based on coaching
                      best practice, spots recurring themes you might miss, tracks your mood and energy to
                      flag burnout risk, and generates personalised suggestions for improvement. It is like
                      having a mentor who reads every entry and remembers everything.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Which sports does CoachReflection support?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Football, rugby, basketball, hockey, tennis, cricket, volleyball, baseball, swimming,
                      athletics, gymnastics, martial arts and more. The AI adapts its terminology, prompts
                      and insights to your sport. A football coach gets questions about formations and player
                      positions, while a swimming coach gets prompts about stroke technique and split times.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I use voice notes instead of typing?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. CoachReflection includes a voice recording feature so you can capture your thoughts
                      immediately after a session while they are fresh. Speak naturally about how the session
                      went and the AI processes your voice notes into structured reflections. This is particularly
                      useful on the training ground when typing is not practical.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Is CoachReflection free?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes, CoachReflection offers a free tier that includes basic reflection logging, guided
                      prompts and session history. Pro users get AI-powered pattern detection, player tracking,
                      mood and energy analytics, voice notes, session plan upload with AI extraction, CPD
                      export and unlimited reflections. Pricing starts from $7.99 per month.
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
                <CardTitle className="text-2xl">Start Your AI Coaching Journal Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-6">
                  Join coaches across 15+ sports who are using AI-powered reflection to accelerate
                  their development. Your next session deserves to be captured properly.
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
