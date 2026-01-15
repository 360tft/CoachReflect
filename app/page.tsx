import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { GUIDED_PROMPTS, INSIGHT_TYPES, MOOD_OPTIONS } from "@/app/types"
import { PricingSection } from "@/app/components/pricing-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-amber-800 dark:text-amber-200">CoachReflect</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          For Football Coaches
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-amber-900 dark:text-amber-100">
          Grow as a Coach Through<br />Guided Reflection
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Transform your post-session thoughts into actionable insights.
          Track patterns, identify player progress, and unlock your coaching potential with AI-powered reflection tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/demo">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
              Try Demo - 3 Free Messages
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline">
              Sign Up Free
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required. Free forever for basic use.
        </p>
      </section>

      {/* Guided Prompts Preview */}
      <section id="how-it-works" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Guided Reflection Questions</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Answer simple questions after each session. Our AI finds patterns and turns your thoughts into growth opportunities.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {GUIDED_PROMPTS.slice(0, 3).map((prompt) => (
            <Card key={prompt.id} className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-lg">{prompt.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">&quot;{prompt.placeholder}&quot;</p>
                {prompt.tip && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    {prompt.tip}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mood Tracking */}
      <section className="container mx-auto px-4 py-16 bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl mx-4">
        <h2 className="text-3xl font-bold text-center mb-4">Track Your Coaching Journey</h2>
        <p className="text-center text-muted-foreground mb-8">
          Log your mood and energy after each session to spot burnout early
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          {MOOD_OPTIONS.map((mood) => (
            <div key={mood.value} className="flex flex-col items-center gap-2">
              <span className="text-sm text-muted-foreground">{mood.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Insights */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">AI-Powered Insights</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Our AI analyzes your reflections over time to surface patterns you might miss
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {INSIGHT_TYPES.slice(0, 6).map((insight) => (
            <Card key={insight.id} className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">{insight.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {insight.id === 'recurring_challenge' && "Spots issues that keep coming up across sessions"}
                  {insight.id === 'player_pattern' && "Tracks individual player mentions and progress"}
                  {insight.id === 'improvement_trend' && "Highlights areas where you're improving"}
                  {insight.id === 'decline_trend' && "Alerts you to areas needing attention"}
                  {insight.id === 'suggestion' && "Personalized recommendations based on your reflections"}
                  {insight.id === 'milestone' && "Celebrates your coaching achievements"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Reflect & Grow</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Guided Journaling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Structured prompts based on coaching best practices
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pattern Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI spots recurring themes across your reflections
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Player Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track individual player mentions and development
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progress Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize your growth and coaching patterns over time
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-4">Coaches Are Growing</h2>
        <p className="text-center text-muted-foreground mb-12">
          Join coaches who are using reflection to level up their practice
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-background">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-3 text-amber-500">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;I used to finish sessions and forget what worked by the next day.
                Now I have a clear record of what&apos;s actually improving my players.
                The AI insights spotted a pattern I completely missed.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <span className="text-amber-800 dark:text-amber-200 font-bold">SM</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Sarah M.</p>
                  <p className="text-xs text-muted-foreground">U12 Girls Coach</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-3 text-amber-500">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;The session plan upload is brilliant. I just snap a photo of my
                whiteboard notes and it understands everything. Saves me 10 minutes
                of typing after every training.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <span className="text-amber-800 dark:text-amber-200 font-bold">JT</span>
                </div>
                <div>
                  <p className="font-medium text-sm">James T.</p>
                  <p className="text-xs text-muted-foreground">Academy Coach</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-3 text-amber-500">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;I&apos;ve been coaching for 15 years and thought I knew my patterns.
                Looking back at 3 months of reflections showed me I was always
                rushing the warm-up. Simple fix, huge impact.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <span className="text-amber-800 dark:text-amber-200 font-bold">MK</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Mike K.</p>
                  <p className="text-xs text-muted-foreground">Senior Team Manager</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-amber-600 text-white border-0 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Ready to Become a Better Coach?</CardTitle>
            <CardDescription className="text-amber-100">
              Join coaches who are using reflection to accelerate their development
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="bg-white text-amber-800 hover:bg-amber-50">
                Try Demo Free
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-amber-700">
                Sign Up
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-800 dark:text-amber-200">CoachReflect</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Part of the 360TFT family of coaching tools
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
