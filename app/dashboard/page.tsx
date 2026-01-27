import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { MoodChart } from "@/app/components/ui/mood-chart"
import { StreakBadges } from "@/app/components/streak-badges"
import { PushNotificationPrompt } from "@/app/components/push-notification-prompt"
import { ReferralCard } from "@/app/components/referral-card"
import { MOOD_OPTIONS } from "@/app/types"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Get recent reflections (10 for chart, display 5)
  const { data: reflections } = await supabase
    .from("reflections")
    .select("*, sessions(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Prepare chart data
  const chartData = (reflections || []).map(r => ({
    date: r.date,
    mood_rating: r.mood_rating || 3,
    energy_rating: r.energy_rating || 3
  }))

  // Get stats
  const { data: stats } = await supabase
    .rpc("get_reflection_stats", { user_uuid: user.id })

  // Get recent extracted insights (themes from reflections)
  const { data: recentInsights } = await supabase
    .from("extracted_insights")
    .select("insight_type, name, context, snippet")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const subscriptionTier = profile?.subscription_tier || "free"
  const isFirstTime = !reflections || reflections.length === 0
  const isEarlyUser = reflections && reflections.length >= 1 && reflections.length <= 3
  const hasInsights = recentInsights && recentInsights.length > 0

  // First-time user onboarding
  if (isFirstTime) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Welcome Card */}
        <Card className="border bg-gradient-to-br from-background to-primary/5 dark:from-background dark:to-primary/10">
          <CardHeader className="text-center pb-2">
            
            <CardTitle className="text-2xl">
              Welcome to Coach Reflection, {profile?.display_name || "Coach"}!
            </CardTitle>
            <CardDescription className="text-base">
              You&apos;re about to transform how you grow as a coach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* How it works */}
            <div className="grid gap-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/80 flex items-center justify-center text-primary dark:text-primary font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Reflect after each session</p>
                  <p className="text-sm text-muted-foreground">
                    Answer guided questions: What worked? What didn&apos;t? Which players stood out?
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/80 flex items-center justify-center text-primary dark:text-primary font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Track mood and energy</p>
                  <p className="text-sm text-muted-foreground">
                    Log how you felt after sessions to spot patterns and prevent burnout
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/80 flex items-center justify-center text-primary dark:text-primary font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Chat with your AI coach</p>
                  <p className="text-sm text-muted-foreground">
                    Get advice, talk through challenges, and plan your next session
                  </p>
                </div>
              </div>
            </div>

            {/* Free tier info */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Your free account includes:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>5 AI coach messages per day</li>
                <li>Mood and energy tracking</li>
                <li>7 days of history and analytics</li>
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Link href="/dashboard/chat" className="block">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white">
                  Start Your First Reflection
                </Button>
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Just chat naturally - upload a voice note or type what happened
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick tip */}
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-3 items-start">
              
              <div>
                <p className="font-medium text-sm">Pro tip</p>
                <p className="text-sm text-muted-foreground">
                  Reflect right after your session while details are fresh. Even 2 minutes of reflection can unlock insights you&apos;d otherwise forget.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.display_name || "Coach"}
          </h1>
          <p className="text-muted-foreground">
            Track your coaching journey through reflection
          </p>
        </div>
        <Link href="/dashboard/chat">
          <Button size="lg">
            + Reflect
          </Button>
        </Link>
      </div>

      {/* Free tier upgrade prompt */}
      {subscriptionTier === "free" && (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium">
                  Free Plan: 5 messages per day, 7 days of history
                </p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro for unlimited messages, voice notes, AI insights, and full analytics history.
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button className="bg-brand hover:bg-brand-hover" size="sm">
                  Upgrade to Pro ($7.99/mo)
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reflections</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.[0]?.total_reflections || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Mood</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.[0]?.avg_mood ? (
                <>
                  {MOOD_OPTIONS.find(m => m.value === Math.round(stats[0].avg_mood))?.label || "Neutral"}
                </>
              ) : (
                "—"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Energy</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.[0]?.avg_energy ? `${stats[0].avg_energy}/5` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.[0]?.streak_days || 0}</p>
            <p className="text-xs text-muted-foreground">sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Post-first-reflection insight card */}
      {isEarlyUser && hasInsights && (
        <Card className="border bg-gradient-to-br from-background to-primary/5 dark:from-background dark:to-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Based on your reflections, here is what I noticed</CardTitle>
            <CardDescription>AI-extracted themes from your coaching sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Themes */}
              {recentInsights!.filter(i => i.insight_type === 'theme').length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Key themes</p>
                  <div className="flex flex-wrap gap-2">
                    {recentInsights!
                      .filter(i => i.insight_type === 'theme')
                      .slice(0, 5)
                      .map((insight, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {insight.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {/* Players mentioned */}
              {recentInsights!.filter(i => i.insight_type === 'player_mention').length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Players mentioned</p>
                  <div className="flex flex-wrap gap-2">
                    {recentInsights!
                      .filter(i => i.insight_type === 'player_mention')
                      .slice(0, 5)
                      .map((insight, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            insight.context === 'positive'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : insight.context === 'concern'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {insight.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {/* Challenges */}
              {recentInsights!.filter(i => i.insight_type === 'challenge').length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Challenges spotted</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {recentInsights!
                      .filter(i => i.insight_type === 'challenge')
                      .slice(0, 3)
                      .map((insight, idx) => (
                        <li key={idx}>{insight.name}</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Keep reflecting to build a deeper picture of your coaching patterns.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Streak and Badges */}
      <StreakBadges />

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />

      {/* Referral Card */}
      <ReferralCard />

      {/* Mood Trend Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Mood Trend</CardTitle>
            <CardDescription>How you&apos;ve been feeling after sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <MoodChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Recent Reflections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reflections</CardTitle>
          <CardDescription>Your latest coaching reflections</CardDescription>
        </CardHeader>
        <CardContent>
          {reflections && reflections.length > 0 ? (
            <div className="space-y-4">
              {reflections.slice(0, 5).map((reflection) => (
                <Link
                  key={reflection.id}
                  href={`/dashboard/reflect/${reflection.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {MOOD_OPTIONS.find(m => m.value === reflection.mood_rating)?.label || "Neutral"}
                        </span>
                        <span className="font-medium truncate">
                          {reflection.sessions?.title || "Untitled Session"}
                        </span>
                      </div>
                      {reflection.what_worked && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {reflection.what_worked}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(reflection.date).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
