import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Footer } from "@/app/components/footer"

export const metadata: Metadata = {
  title: "Coaching CPD Log - Track Your Professional Development",
  description: "Digital CPD log for sports coaches. Automatically generate CPD evidence from your coaching reflections. Track hours, export PDF portfolios and meet FA, UEFA and US Soccer CPD requirements. Free to start.",
  alternates: {
    canonical: "https://coachreflection.com/cpd-coaching-log",
  },
  openGraph: {
    title: "Coaching CPD Log - Track Your Professional Development | Coach Reflection",
    description: "Digital CPD log for sports coaches. Auto-generate CPD evidence from reflections, track hours, export PDF portfolios and meet federation CPD requirements.",
    url: "https://coachreflection.com/cpd-coaching-log",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coaching CPD Log - Track Your Professional Development | Coach Reflection",
    description: "Digital CPD coaching log with auto-generated evidence, hour tracking and PDF export for federation CPD requirements.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What counts as CPD for sports coaches?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Continuing Professional Development for sports coaches includes a wide range of activities: attending coaching courses and workshops, completing online learning modules, mentoring or being mentored, observing other coaches, self-directed study and research, reflective practice after sessions, attending conferences, and engaging with coaching communities. Most governing bodies accept structured reflection as valid CPD evidence, which is exactly what Coach Reflection provides automatically."
      }
    },
    {
      "@type": "Question",
      "name": "How does Coach Reflection generate CPD evidence automatically?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Every time you complete a reflection in Coach Reflection, the AI structures your thoughts into a format that qualifies as CPD evidence. It records what you learned, what you would change, and how the session developed your coaching practice. These reflections are timestamped, categorised by coaching theme and tagged with development areas. When you need to submit CPD evidence, you export your reflections as a formatted PDF portfolio that meets federation requirements."
      }
    },
    {
      "@type": "Question",
      "name": "How many CPD hours do FA coaches need?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Football Association requires coaches to complete a minimum number of CPD hours to maintain their qualifications. FA Level 2 (UEFA C) coaches need at least 6 hours of CPD per year. UEFA B licence holders need 12 hours per year. UEFA A licence holders need 18 hours per year. Requirements vary by qualification level and are subject to change, so always check the latest FA guidance. Coach Reflection tracks your hours automatically based on your reflection activity."
      }
    },
    {
      "@type": "Question",
      "name": "Can I export my CPD log as a PDF?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Coach Reflection Pro includes a PDF export feature specifically designed for CPD portfolio submission. The export includes a summary of your development themes, individual reflection entries with dates and coaching context, a breakdown of hours logged, and your key learning outcomes. The format is designed to be accepted by governing bodies including the FA, UEFA, US Soccer and other federations."
      }
    },
    {
      "@type": "Question",
      "name": "Is reflective practice accepted as CPD by coaching federations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Most major coaching federations recognise structured reflective practice as a valid form of CPD. The FA, UEFA, US Soccer, Basketball England, Rugby Football Union and many others accept documented reflection as evidence of ongoing professional development. The key requirement is that reflections are structured, dated and demonstrate learning. Coach Reflection ensures all of these criteria are met automatically through its guided reflection prompts and AI analysis."
      }
    }
  ]
}

export default function CpdCoachingLogPage() {
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
              Digital CPD Log for Sports Coaches
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Every reflection you write automatically becomes CPD evidence. Track your
              professional development hours, build your coaching portfolio and export
              formatted PDF reports for federation submissions.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Meets FA, UEFA, US Soccer, Basketball England and Rugby Football Union CPD requirements
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

          {/* Why Coaches Need CPD Tracking */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Why Coaches Need a Digital CPD Log
              </h2>
              <div className="bg-card rounded-2xl border p-8 md:p-12">
                <div className="space-y-4 text-muted-foreground text-lg">
                  <p>
                    CPD is not optional for serious coaches. Governing bodies across football,
                    rugby, basketball, cricket and other sports require coaches to demonstrate
                    ongoing professional development to maintain their qualifications. Without
                    evidence, your licence can lapse.
                  </p>
                  <p>
                    The problem is that most coaches leave CPD tracking until the last minute.
                    They scramble to recall what courses they attended, what they learned from
                    observing other coaches, and how their practice has developed over the past
                    year. Certificates get lost. Notes from workshops end up in forgotten
                    notebooks. The result is a rushed, incomplete portfolio that does not
                    reflect the genuine development that happened.
                  </p>
                  <p>
                    A digital CPD log solves this by capturing evidence as it happens. With
                    Coach Reflection, every post-session reflection you write is automatically
                    timestamped, structured and categorised as CPD evidence. When submission
                    time arrives, your portfolio is already built. You just export it.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What Counts as CPD */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                What Counts as Coaching CPD
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Reflective Practice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Structured reflection after coaching sessions is recognised by virtually
                      every governing body as valid CPD. Writing about what went well, what you
                      would change and what you learned counts towards your development hours.
                      Coach Reflection turns this into formatted evidence automatically.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Courses and Workshops</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Attending coaching courses, workshops, conferences and webinars all
                      count as CPD. Log these in Coach Reflection alongside your session
                      reflections so everything lives in one place. Record what you attended,
                      what you took away from it and how you plan to apply it.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-l-4 border-l-emerald-400">
                  <CardHeader>
                    <CardTitle className="text-lg">Mentoring and Observation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Observing other coaches, being mentored, or mentoring less experienced
                      coaches all qualify as CPD activities. Use Coach Reflection to capture
                      your observations and takeaways from these experiences. The AI helps
                      you extract the learning from each interaction.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* How Coach Reflection Generates CPD Evidence */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How Your Reflections Become CPD Evidence
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Automatic Structuring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      When you write a reflection after a session, the AI structures it into
                      CPD-ready format. It identifies the learning outcomes, development areas
                      and action points from your natural writing. You do not need to think
                      about CPD formatting while reflecting. Just write honestly about your
                      session and the structure happens behind the scenes.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Development Theme Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The AI analyses your reflections over time and identifies recurring
                      development themes. If you consistently reflect on communication
                      challenges, session management or differentiation, these become tracked
                      development areas in your CPD portfolio. This shows assessors that your
                      development is sustained and purposeful, not random.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Hour Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coach Reflection logs the time you spend on reflective practice and
                      tracks it against your federation&apos;s CPD requirements. See at a glance
                      how many hours you have completed, how many remain and whether you are
                      on track for the year. No more guessing or manually tallying hours from
                      scattered records.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>PDF Portfolio Export</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      When it is time to submit your CPD evidence, export your reflections
                      as a professionally formatted PDF. The export includes a development
                      summary, individual reflection entries with dates and context, hours
                      breakdown and key learning outcomes. Designed to meet the submission
                      standards of major governing bodies.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Voice Note Reflections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Record your thoughts by voice immediately after a session. The AI
                      transcribes and structures your spoken reflections into CPD evidence.
                      This means you can capture genuine, in-the-moment learning on the
                      training ground without needing to sit down and type. Every voice
                      note becomes a dated, structured CPD entry.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Action Plan Generation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Based on your reflections, the AI suggests specific actions for your
                      development. These become part of your CPD portfolio as forward-looking
                      goals. Assessors want to see not just what you have done but what you
                      plan to do next. Coach Reflection generates these action plans from
                      your own reflective insights.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Mid-page CTA */}
          <section className="container mx-auto px-4 py-12 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Start building your CPD portfolio today. Free tier available.
            </p>
          </section>

          {/* Federation CPD Requirements */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
                  CPD Requirements by Federation
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">The FA (England)</h3>
                    <p className="text-muted-foreground mb-6">
                      The Football Association requires coaches to complete CPD to maintain
                      their coaching qualifications. FA Level 2 (UEFA C) coaches need a
                      minimum of 6 CPD hours per year. UEFA B holders need 12 hours. UEFA A
                      holders need 18 hours. The FA accepts reflective practice as valid CPD
                      evidence when it is structured and demonstrates learning outcomes.
                    </p>
                    <h3 className="font-semibold mb-3">UEFA</h3>
                    <p className="text-muted-foreground">
                      UEFA&apos;s coaching convention requires member associations to implement
                      CPD programmes for licensed coaches. The emphasis is on reflective
                      practice, peer observation and structured learning. A documented
                      reflection log that shows sustained development over time is exactly
                      what UEFA-aligned programmes look for in CPD submissions.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">US Soccer</h3>
                    <p className="text-muted-foreground mb-6">
                      US Soccer requires coaches to maintain their licences through continuing
                      education. Coaches must complete specified learning activities within
                      each licence cycle. Reflective practice, mentoring and self-directed
                      learning are all recognised pathways. Coach Reflection provides the
                      documentation structure that US Soccer expects for evidence submission.
                    </p>
                    <h3 className="font-semibold mb-3">Other Sports</h3>
                    <p className="text-muted-foreground">
                      CPD requirements extend beyond football. Basketball England, the Rugby
                      Football Union, England Hockey, the England and Wales Cricket Board and
                      many other governing bodies require coaches to demonstrate ongoing
                      development. Coach Reflection supports all of these sports with
                      sport-specific prompts and terminology in your CPD evidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits of Digital vs Paper */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Digital CPD Log vs Paper Records
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Never Lose Evidence Again</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Paper certificates get lost. Workshop notes end up in drawers. Course
                      confirmations disappear from inboxes. A digital CPD log keeps everything
                      in one searchable, backed-up location. When your federation asks for
                      evidence from eight months ago, it is there in seconds.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Consistent, Structured Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Paper logs vary wildly in quality. Some reflections are detailed, others
                      are two words scrawled after a long session. Coach Reflection ensures
                      every entry follows a consistent structure with learning outcomes,
                      development areas and action points. This consistency strengthens your
                      entire portfolio.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Real-Time Progress Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      With paper records, you have no idea whether you are on track until you
                      sit down and count everything up. A digital CPD tracker shows your
                      progress in real time. See your hours logged, themes covered and gaps
                      to address at any point during the year.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Instant Export and Sharing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      When it is time to submit, you do not need to photocopy, scan or
                      reorganise anything. Export your digital CPD portfolio as a PDF in one
                      click. Share it with your federation, club or mentor directly. The
                      format is professional and meets submission standards without any
                      additional formatting work.
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
                CPD Tracking for Every Sport
              </h2>
              <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                Coach Reflection adapts its CPD evidence format to your sport. The AI
                understands sport-specific terminology and tailors development themes accordingly.
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

          {/* FAQ */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">What counts as CPD for sports coaches?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Continuing Professional Development for sports coaches includes a wide
                      range of activities: attending coaching courses and workshops, completing
                      online learning modules, mentoring or being mentored, observing other
                      coaches, self-directed study and research, reflective practice after
                      sessions, attending conferences and engaging with coaching communities.
                      Most governing bodies accept structured reflection as valid CPD evidence,
                      which is exactly what Coach Reflection provides automatically.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How does Coach Reflection generate CPD evidence automatically?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Every time you complete a reflection in Coach Reflection, the AI structures
                      your thoughts into a format that qualifies as CPD evidence. It records what
                      you learned, what you would change and how the session developed your coaching
                      practice. These reflections are timestamped, categorised by coaching theme
                      and tagged with development areas. When you need to submit CPD evidence, you
                      export your reflections as a formatted PDF portfolio that meets federation
                      requirements.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How many CPD hours do FA coaches need?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The Football Association requires coaches to complete a minimum number of
                      CPD hours to maintain their qualifications. FA Level 2 (UEFA C) coaches
                      need at least 6 hours of CPD per year. UEFA B licence holders need 12
                      hours per year. UEFA A licence holders need 18 hours per year. Requirements
                      vary by qualification level and are subject to change, so always check the
                      latest FA guidance. Coach Reflection tracks your hours automatically based
                      on your reflection activity.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can I export my CPD log as a PDF?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. Coach Reflection Pro includes a PDF export feature specifically designed
                      for CPD portfolio submission. The export includes a summary of your development
                      themes, individual reflection entries with dates and coaching context, a
                      breakdown of hours logged and your key learning outcomes. The format is
                      designed to be accepted by governing bodies including the FA, UEFA, US Soccer
                      and other federations.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Is reflective practice accepted as CPD by coaching federations?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes. Most major coaching federations recognise structured reflective practice
                      as a valid form of CPD. The FA, UEFA, US Soccer, Basketball England, the
                      Rugby Football Union and many others accept documented reflection as evidence
                      of ongoing professional development. The key requirement is that reflections
                      are structured, dated and demonstrate learning. Coach Reflection ensures all
                      of these criteria are met automatically through its guided reflection prompts
                      and AI analysis.
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
                <CardTitle className="text-2xl">Start Building Your CPD Portfolio Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-6">
                  Join coaches across 15+ sports who are using AI-powered reflection to
                  meet their CPD requirements. Every session you reflect on becomes evidence
                  in your professional development portfolio.
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
