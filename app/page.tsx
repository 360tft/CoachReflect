import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { GUIDED_PROMPTS, INSIGHT_TYPES, MOOD_OPTIONS } from "@/app/types"
import { PricingSection } from "@/app/components/pricing-section"
import { Footer } from "@/app/components/footer"
import { AskAI } from "@/app/components/ask-ai"

const COACHREFLECT_AI_PROMPT = `As a sports coach who wants to improve but doesn't track what I actually coach, explain what Coach Reflection is.

Cover: How does the reflection/journaling process work? What do I log after each session? How does it help me identify patterns and gaps in my coaching? Is there AI-powered feedback? How is this different from just keeping notes? What sports does it support? What's the pricing model?`

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Coach Reflection" width={200} height={36} />
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          For Sports Coaches
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Grow as a Coach Through<br />Guided Reflection
        </h1>
        <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
          Transform your post-session thoughts into actionable insights.
          Track patterns, identify athlete progress, and unlock your coaching potential.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Football, Rugby, Basketball, Tennis, Swimming, and 10+ more sports
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg">
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Free tier available. No credit card required.
        </p>
        <AskAI
          question="What is Coach Reflection?"
          prompt={COACHREFLECT_AI_PROMPT}
          className="mt-6"
        />
      </section>

      {/* Guided Prompts Preview */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Guided Reflection Questions</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Answer simple questions after each session. Our AI finds patterns and turns your thoughts into growth opportunities.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {GUIDED_PROMPTS.slice(0, 3).map((prompt) => (
            <Card key={prompt.id} className="border">
              <CardHeader>
                <CardTitle className="text-lg">{prompt.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">&quot;{prompt.placeholder}&quot;</p>
                {prompt.tip && (
                  <p className="text-xs text-primary mt-2">
                    {prompt.tip}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mood Tracking */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-muted/50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Track Your Coaching Journey</h2>
          <p className="text-muted-foreground mb-8">
            Log your mood and energy after each session to spot burnout early
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {MOOD_OPTIONS.map((mood) => (
              <div key={mood.value} className="flex flex-col items-center gap-2 px-4 py-2 rounded-lg bg-background border">
                <span className="text-sm font-medium">{mood.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">AI-Powered Insights</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Our AI analyzes your reflections over time to surface patterns you might miss
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {INSIGHT_TYPES.slice(0, 6).map((insight) => (
            <Card key={insight.id} className="text-center border">
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
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Reflect & Grow</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border">
            <CardHeader>
              <CardTitle>Guided Journaling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Structured prompts based on coaching best practices
              </p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardHeader>
              <CardTitle>Pattern Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI spots recurring themes across your reflections
              </p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardHeader>
              <CardTitle>Player Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track individual player mentions and development
              </p>
            </CardContent>
          </Card>
          <Card className="border">
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

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Common Questions</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Quick answers about Coach Reflection
        </p>
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What sports does this work for?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Football, rugby, basketball, hockey, tennis, cricket, volleyball, baseball, swimming, athletics, gymnastics, martial arts, and more. The AI adapts its terminology and advice to your sport.
              </p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">How is this different from keeping notes?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notes sit in a notebook. Coach Reflection asks you the right questions, spots patterns you might miss, and helps you identify what&apos;s actually working. It&apos;s like having a mentor who remembers everything.
              </p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Is my data private?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes. Your reflections are encrypted and never shared. We don&apos;t sell data or use it to train AI models. You can export or delete your data at any time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="bg-primary text-primary-foreground border-0 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Become a Better Coach?</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Join coaches who are using reflection to accelerate their development
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
