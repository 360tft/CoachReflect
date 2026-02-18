import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"

export const metadata: Metadata = {
  title: "Football Reflection Journal for Coaches",
  description: "A structured football reflection journal that helps coaches review training sessions and matches. Guided prompts, AI insights, player tracking and pattern detection. Free to start.",
  alternates: {
    canonical: "https://coachreflection.com/football-reflection",
  },
  openGraph: {
    title: "Football Reflection Journal for Coaches | CoachReflection",
    description: "A structured football reflection journal that helps coaches review training sessions and matches. Guided prompts, AI insights and player tracking.",
    url: "https://coachreflection.com/football-reflection",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Football Reflection Journal for Coaches | CoachReflection",
    description: "A structured football reflection journal with guided prompts, AI insights and player tracking for football coaches.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a football reflection journal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A football reflection journal is a tool that helps coaches capture learnings from training sessions and matches. CoachReflection adds AI-powered guided prompts tailored to football coaching, pattern detection across your season, and automatic player tracking that monitors individual development from your own observations."
      }
    },
    {
      "@type": "Question",
      "name": "What should I reflect on after a football training session?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Good post-session reflection covers whether your objectives were met, how players responded to the activities, what you would change, which coaching interventions worked, and what to carry into the next session. CoachReflection provides guided prompts so you do not need to decide what to write. The AI asks specific questions and structures your answers into useful insights."
      }
    },
    {
      "@type": "Question",
      "name": "How does reflective practice help football coaches?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Reflective practice helps football coaches identify what is working and what is not, track individual player development, spot recurring challenges before they become entrenched habits, and provide evidence for CPD portfolios. Coaches who reflect consistently make better decisions because they build on evidence rather than memory alone."
      }
    },
    {
      "@type": "Question",
      "name": "Can I record voice notes instead of typing my reflections?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. CoachReflection includes a voice recording feature so you can capture your thoughts immediately after a session while they are fresh. Speak naturally about how the session went and the AI processes your voice notes into structured reflections. This is particularly useful pitchside when typing is not practical."
      }
    },
    {
      "@type": "Question",
      "name": "Is CoachReflection free for football coaches?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The free tier includes basic reflection logging, guided prompts and session history. Pro features include AI-powered pattern detection, player tracking, voice notes, session plan upload with AI extraction, mood and energy analytics, and CPD export. Pro starts from $7.99 per month."
      }
    }
  ]
}

export default function FootballReflectionPage() {
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
              Football Reflection Journal for Coaches
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Capture what happened after every training session and match. Guided prompts
              help you reflect on what worked, what did not, and what to change next time.
              AI spots the patterns you miss.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Built for football coaches at every level, from grassroots to academy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Start Reflecting Free</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free tier available. No credit card required.
            </p>
          </section>

          {/* Why Football Coaches Need Structured Reflection */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Why Football Coaches Need Structured Reflection
              </h2>
              <div className="bg-card rounded-2xl border p-8 md:p-12">
                <div className="space-y-4 text-muted-foreground text-lg">
                  <p>
                    You finish a training session and your head is buzzing. The pressing drill
                    worked better than expected. Two players were not engaged. Your transitions
                    activity took longer to set up than you planned and ate into the game time.
                    By Thursday, those observations have blurred into a general sense that it
                    &quot;went okay.&quot;
                  </p>
                  <p>
                    Football coaching is full of detail that gets lost. The difference between a
                    coach who improves season on season and one who stays the same often comes
                    down to whether they capture and revisit their observations. Not in a vague
                    &quot;I should reflect more&quot; way, but in a structured, consistent habit that
                    turns fleeting thoughts into actionable intelligence.
                  </p>
                  <p>
                    CoachReflection gives you that structure. Answer guided questions after each
                    session, and over time the AI finds the threads running through your coaching.
                    The recurring challenges. The players who need attention. The sessions where
                    your energy was low and the quality suffered. It is reflection that actually
                    leads somewhere.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How It Works for Football Coaches
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">After Training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Open the app and answer guided questions about your session. Did the
                      activities achieve their objectives? How did players respond? What coaching
                      interventions did you make? You can type or use voice notes straight from
                      the pitch.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg">After the Match</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reflect on matchday performance. Did your game model translate onto the
                      pitch? How did individual players perform? What would you change tactically?
                      Capturing match reflections while they are fresh is where the best insights
                      come from.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-emerald-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Across the Season</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI analyses your reflections across weeks and months. It flags
                      recurring themes, tracks player mentions, monitors your mood and energy,
                      and generates insights that only become visible over time. Your end-of-season
                      review writes itself.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Football-Specific Features */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Features for Football Coaches
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Post-Session Reflection Prompts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Guided questions designed around football coaching practice. Reflect on your
                      session objectives, player responses, coaching interventions, transitions
                      between activities, and what you would change. The prompts adapt based on
                      whether you are reflecting on training or a match.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Player Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Mention players naturally in your reflections and the AI tracks them
                      automatically. See which players you write about most, how your observations
                      change over the season, and get prompted about players who have slipped
                      under the radar.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Voice Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Record your thoughts by speaking after a session. The AI transcribes and
                      structures your voice notes into a proper reflection. Perfect for capturing
                      thoughts pitchside, in the car, or while putting the bibs away.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Session Plan Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Upload a photo of your session plan, handwritten or digital. AI vision
                      extracts objectives, activities and coaching points automatically. Then
                      reflect on how the session actually went compared to what you planned.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Pattern Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI surfaces trends across your reflections. Perhaps you consistently
                      mention struggling with transitions between activities. Perhaps your mood
                      drops after Tuesday evening sessions. Perhaps your team performs differently
                      on 3G pitches. These patterns appear automatically.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>CPD Export</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Export your reflections as evidence for your Continuing Professional
                      Development portfolio. Formatted reports show your reflection practice,
                      coaching themes and development areas. Suitable for FA, UEFA, and other
                      federation CPD requirements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* What Good Football Reflection Looks Like */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
                  What Good Football Reflection Looks Like
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Without a System</h3>
                    <p className="text-muted-foreground mb-6">
                      &quot;Session was alright. Pressing drill went well. Need to work on
                      finishing.&quot; That is the level of detail most coaches capture. It is too
                      vague to learn from. What specifically worked about the pressing drill? What
                      kind of finishing? In what context? A week later you cannot remember.
                    </p>
                    <h3 className="font-semibold mb-3">With CoachReflection</h3>
                    <p className="text-muted-foreground">
                      The guided prompts push you to be specific. You capture that the pressing
                      trigger worked when the ball went to the full-back but not when it went
                      centrally, that two players did not understand their recovery runs, and that
                      the finishing exercise needed a time constraint to increase intensity. Now
                      you have something concrete for next session.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Across a Full Season</h3>
                    <p className="text-muted-foreground mb-6">
                      After months of structured reflections, the AI can show you that your team
                      performs best in sessions with clear constraints, that your energy is lowest
                      on Thursday evenings, and that three players have been consistently
                      improving since October. That level of insight changes how you plan, coach,
                      and develop your squad.
                    </p>
                    <h3 className="font-semibold mb-3">For Your CPD Portfolio</h3>
                    <p className="text-muted-foreground">
                      Every reflection you log becomes evidence of your coaching development.
                      Export formatted reports showing your reflection practice, coaching themes,
                      and areas of growth. Whether you are working towards your UEFA B or
                      maintaining your licence, your CPD evidence builds automatically.
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
                    <CardTitle className="text-base">What is a football reflection journal?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A football reflection journal is a tool that helps coaches capture learnings from
                      training sessions and matches. CoachReflection adds AI-powered guided prompts tailored
                      to football coaching, pattern detection across your season, and automatic player tracking
                      that monitors individual development from your own observations.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">What should I reflect on after a football training session?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Good post-session reflection covers whether your objectives were met, how players
                      responded to the activities, what you would change, which coaching interventions worked,
                      and what to carry into the next session. CoachReflection provides guided prompts so you
                      do not need to decide what to write.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How does reflective practice help football coaches?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reflective practice helps football coaches identify what is working and what is not,
                      track individual player development, spot recurring challenges, and provide evidence for
                      CPD portfolios. Coaches who reflect consistently make better decisions because they build
                      on evidence rather than memory alone.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I record voice notes instead of typing my reflections?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. CoachReflection includes a voice recording feature so you can capture your thoughts
                      immediately after a session while they are fresh. Speak naturally about how the session
                      went and the AI processes your voice notes into structured reflections. Particularly useful
                      pitchside when typing is not practical.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Is CoachReflection free for football coaches?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. The free tier includes basic reflection logging, guided prompts and session history.
                      Pro features include AI-powered pattern detection, player tracking, voice notes, session plan
                      upload, mood and energy analytics, and CPD export. Pro starts from $7.99 per month.
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
                <CardTitle className="text-2xl">Start Your Football Reflection Journal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-6">
                  Join football coaches who are using structured reflection to improve their
                  coaching. Your next session deserves to be captured properly.
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
