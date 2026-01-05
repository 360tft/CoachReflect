import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { GUIDED_PROMPTS, INSIGHT_TYPES, MOOD_OPTIONS } from "@/app/types"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪞</span>
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
          <Link href="/signup">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
              Start Reflecting Free
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline">
              See How It Works
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
                <p className="text-sm text-muted-foreground italic">"{prompt.placeholder}"</p>
                {prompt.tip && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    💡 {prompt.tip}
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
              <span className="text-4xl">{mood.emoji}</span>
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
                <div className="text-3xl mb-2">{insight.emoji}</div>
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
              <div className="text-2xl mb-2">📝</div>
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
              <div className="text-2xl mb-2">🔍</div>
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
              <div className="text-2xl mb-2">👤</div>
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
              <div className="text-2xl mb-2">📊</div>
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

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-center text-muted-foreground mb-12">
          Start free, upgrade when you need more
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Get started with reflection</CardDescription>
              <div className="text-3xl font-bold mt-4">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 10 reflections/month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Guided prompts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Mood tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Basic insights
                </li>
              </ul>
              <Link href="/signup" className="block mt-6">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-amber-500 border-2 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-amber-500 text-white">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For serious coaches</CardDescription>
              <div className="text-3xl font-bold mt-4">$9<span className="text-lg font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited reflections
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> AI-powered insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Pattern detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Player tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Export to PDF
                </li>
              </ul>
              <Link href="/signup?plan=pro" className="block mt-6">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">Start Pro Trial</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro+ */}
          <Card>
            <CardHeader>
              <CardTitle>Pro+</CardTitle>
              <CardDescription>For coaching organizations</CardDescription>
              <div className="text-3xl font-bold mt-4">$29<span className="text-lg font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Team collaboration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> CPD documentation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Priority support
                </li>
              </ul>
              <Link href="/signup?plan=pro_plus" className="block mt-6">
                <Button variant="outline" className="w-full">Contact Us</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-amber-600 text-white border-0 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Ready to Become a Better Coach?</CardTitle>
            <CardDescription className="text-amber-100">
              Join coaches who are using reflection to accelerate their development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="bg-white text-amber-800 hover:bg-amber-50">
                Start Your Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪞</span>
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
