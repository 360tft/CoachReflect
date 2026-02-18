import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"

export const metadata: Metadata = {
  title: "Soccer Reflection Journal for Coaches",
  description: "A structured soccer reflection journal that helps coaches review matches and practices. Guided prompts, AI insights, player tracking and pattern detection. Free to start.",
  alternates: {
    canonical: "https://coachreflection.com/soccer-reflection",
  },
  openGraph: {
    title: "Soccer Reflection Journal for Coaches | CoachReflection",
    description: "A structured soccer reflection journal that helps coaches review matches and practices. Guided prompts, AI insights and player tracking.",
    url: "https://coachreflection.com/soccer-reflection",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soccer Reflection Journal for Coaches | CoachReflection",
    description: "A structured soccer reflection journal with guided prompts, AI insights and player tracking for soccer coaches.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a soccer reflection journal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A soccer reflection journal is a tool that helps coaches capture and learn from their matches and practices. CoachReflection takes this further with AI-powered guided prompts that ask targeted questions about your soccer sessions, pattern detection that surfaces trends across weeks and months, and player tracking that monitors individual development over time."
      }
    },
    {
      "@type": "Question",
      "name": "What should I write in a soccer post-match reflection?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A good post-match reflection covers what went well, what you would change, how individual players performed, whether your game plan worked, and what you want to focus on next. CoachReflection provides guided prompts so you do not have to figure out what to write. The AI asks you specific questions about your match and turns your answers into structured insights."
      }
    },
    {
      "@type": "Question",
      "name": "How does AI help with soccer coaching reflection?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The AI analyses your reflections over time to find patterns you might miss. For example, it might notice that your team consistently struggles in the first ten minutes, that a particular player is mentioned less frequently than others, or that your energy levels drop after midweek games. These insights help you make better coaching decisions based on evidence rather than gut feeling."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use voice notes for my soccer reflections?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. After a match or practice, you can record your thoughts by speaking into the app. The AI transcribes your voice notes and processes them into structured reflections. This is ideal for capturing your thoughts on the sideline or in the car on the way home while everything is still fresh."
      }
    },
    {
      "@type": "Question",
      "name": "Is CoachReflection free for soccer coaches?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The free tier includes basic reflection logging, guided prompts and session history. Pro features include AI-powered pattern detection, player tracking, voice notes, session plan upload with AI extraction, mood and energy analytics, and CPD export. Pro starts from $7.99 per month."
      }
    }
  ]
}

export default function SoccerReflectionPage() {
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
              Soccer Reflection Journal for Coaches
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Capture what happened after every match and practice. Guided prompts help you
              reflect on what worked, what did not, and what to change. AI spots the patterns
              you miss.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Built for soccer coaches at every level, from recreational to club academy.
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

          {/* Why Soccer Coaches Need Structured Reflection */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Why Soccer Coaches Need Structured Reflection
              </h2>
              <div className="bg-card rounded-2xl border p-8 md:p-12">
                <div className="space-y-4 text-muted-foreground text-lg">
                  <p>
                    You finish a match and your head is full of observations. The defensive line was too
                    high. Your number 9 made three runs that nobody picked out. The substitution at
                    halftime changed the energy. But by the time the next game comes around, most of
                    those details have faded.
                  </p>
                  <p>
                    Soccer coaches who reflect consistently improve faster. That is not a slogan. It is
                    what happens when you force yourself to articulate what you saw, compare it to what
                    you planned, and write down what you would do differently. The act of writing it
                    down turns a vague feeling into something you can act on.
                  </p>
                  <p>
                    The problem is that most coaches do not have a system for it. Notes end up in
                    different apps, notebooks get lost, and there is no way to see trends across an
                    entire season. CoachReflection gives you a structured place to capture post-match
                    and post-practice thoughts, and uses AI to surface the patterns that matter.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How It Works for Soccer Coaches
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">After the Match</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Open the app and answer guided questions about the match. How did your
                      formation work? Which players stood out? What would you change? You can
                      type or use voice notes straight from the sideline.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg">After Practice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reflect on your practice sessions too. Did the drill achieve what you
                      intended? Were players engaged? What would you tweak? Capturing practice
                      reflections is where the real growth happens for most coaches.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-emerald-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Over the Season</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI analyses your reflections across weeks and months. It flags
                      recurring challenges, tracks player development, monitors your energy and
                      mood, and generates insights you would never spot from individual entries.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Soccer-Specific Features */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Features for Soccer Coaches
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Post-Match Reflection Prompts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Guided questions designed around soccer coaching. Reflect on your tactical
                      approach, player performances, set pieces, substitutions and match
                      management. The prompts adapt based on whether you are reflecting on a
                      match or a practice.
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
                      automatically. See which players appear frequently, how their mentions
                      change over the season, and get prompted about players you have not
                      mentioned recently.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Voice Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Record your thoughts by speaking after a match or practice. The AI
                      transcribes and structures your voice notes into a proper reflection.
                      Ideal for capturing thoughts in the car, on the sideline, or while
                      packing up cones.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Session Plan Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Upload a photo of your practice plan, handwritten or digital. AI vision
                      extracts objectives, drills and coaching points automatically. Then
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
                      The AI spots trends across your reflections. Maybe you always mention
                      struggling with transitions. Maybe your mood drops after away games.
                      Maybe your team performs differently on artificial turf. These patterns
                      surface automatically.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>CPD Export</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Export your reflections as evidence for your coaching licence requirements.
                      Formatted reports show your reflection practice, coaching themes and
                      development areas. Suitable for US Soccer, state association, and other
                      federation CPD requirements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* What Good Soccer Reflection Looks Like */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
                  What Good Soccer Reflection Looks Like
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Without a System</h3>
                    <p className="text-muted-foreground mb-6">
                      &quot;We lost 3-1. Defence was bad. Need to work on it.&quot; That is the level
                      of detail most coaches capture. It is too vague to be useful. What specifically
                      went wrong? Was it positioning, communication, individual errors? A week later
                      you cannot remember.
                    </p>
                    <h3 className="font-semibold mb-3">With CoachReflection</h3>
                    <p className="text-muted-foreground">
                      The guided prompts push you to be specific. You capture that the defensive line
                      was sitting too deep in the second half, that your centre-backs were not
                      communicating at set pieces, and that the opposition exploited the space behind
                      your right back after the 60th minute. Now you have something to work with.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Over a Full Season</h3>
                    <p className="text-muted-foreground mb-6">
                      After 30 matches worth of structured reflections, the AI can tell you that your
                      team concedes more in the second half, that your energy levels drop in November,
                      and that your substitution patterns have improved since September. That is the
                      kind of insight that changes your coaching.
                    </p>
                    <h3 className="font-semibold mb-3">For Player Development</h3>
                    <p className="text-muted-foreground">
                      The AI tracks every player you mention. At the end of the season, you can see
                      which players you wrote about most, how the tone of your mentions changed over
                      time, and whether any players slipped under your radar. It is a development
                      record built from your own observations.
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
                    <CardTitle className="text-base">What is a soccer reflection journal?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A soccer reflection journal is a tool that helps coaches capture and learn from their
                      matches and practices. CoachReflection takes this further with AI-powered guided prompts,
                      pattern detection that surfaces trends across weeks and months, and player tracking that
                      monitors individual development over time.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">What should I write in a soccer post-match reflection?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A good post-match reflection covers what went well, what you would change, how individual
                      players performed, whether your game plan worked, and what you want to focus on next.
                      CoachReflection provides guided prompts so you do not have to figure out what to write.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How does AI help with soccer coaching reflection?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI analyses your reflections over time to find patterns you might miss. It might notice
                      that your team consistently struggles in the first ten minutes, that a particular player is
                      mentioned less frequently, or that your energy levels drop after midweek games.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I use voice notes for my soccer reflections?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. After a match or practice, record your thoughts by speaking into the app. The AI
                      transcribes your voice notes and processes them into structured reflections. Ideal for
                      capturing thoughts on the sideline or in the car on the way home.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Is CoachReflection free for soccer coaches?</CardTitle>
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
                <CardTitle className="text-2xl">Start Your Soccer Reflection Journal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-6">
                  Join soccer coaches who are using structured reflection to improve their coaching.
                  Your next match deserves to be captured properly.
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
