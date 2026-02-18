import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { MoodChart } from "@/app/components/ui/mood-chart"
import { StreakBadges } from "@/app/components/streak-badges"
import { PushNotificationPrompt } from "@/app/components/push-notification-prompt"
import { OnboardingProfile } from "@/app/components/onboarding-profile"
import { TrialCountdown } from "@/app/components/trial-countdown"
import { ReferralCard } from "@/app/components/referral-card"
import { ShareSummaryButton } from "./share-summary-button"
import { TaskList } from "@/app/components/task-list"
import { NativeHidden } from "@/app/components/native-hidden"
import { PatternPreview } from "@/app/components/pattern-preview"
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
        <Card className="border bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
          <CardHeader className="text-center pb-2">

            <CardTitle className="text-2xl">
              Welcome to CoachReflection, {profile?.display_name || "Coach"}!
            </CardTitle>
            <CardDescription className="text-base">
              Let&apos;s get your first reflection done.
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
                  <p className="font-medium">Tell us what happened</p>
                  <p className="text-sm text-muted-foreground">
                    Open the app after your session. Type or use a voice note. Two minutes.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/80 flex items-center justify-center text-primary dark:text-primary font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Rate how it felt</p>
                  <p className="text-sm text-muted-foreground">
                    One tap. Helps you spot burnout before it hits.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/80 flex items-center justify-center text-primary dark:text-primary font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">See what the AI spots</p>
                  <p className="text-sm text-muted-foreground">
                    Patterns emerge after a few sessions. Things you didn&apos;t notice yourself.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile setup */}
            {!profile?.sport && (
              <div className="bg-muted/50 rounded-lg p-4">
                <OnboardingProfile />
              </div>
            )}

            {/* Free tier info */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Your free account:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>2 reflections per day to get started</li>
                <li>Mood tracking to catch burnout early</li>
                <li>7 days of history</li>
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
        <div className="flex items-center gap-3">
          <ShareSummaryButton />
          <Link href="/dashboard/chat">
            <Button size="lg">
              + Reflect
            </Button>
          </Link>
        </div>
      </div>

      {/* Trial countdown */}
      {profile?.subscription_status === "trialing" && profile?.updated_at && (
        <TrialCountdown trialStartDate={profile.updated_at} />
      )}

      {/* Free tier upgrade prompt (web only - native uses IAP via settings) */}
      <NativeHidden>
        {subscriptionTier === "free" && (
          <Card className="border-brand/30 bg-brand/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-medium">
                    You&apos;re building a habit. Pro takes it further.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unlimited reflections, voice notes on the drive home, and a searchable coaching library. See what 7 days of Pro reveals.
                  </p>
                </div>
                <Link href="/dashboard/settings">
                  <Button className="bg-brand hover:bg-brand-hover !text-white" size="sm">
                    Try Pro Free for 7 Days
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </NativeHidden>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Total Reflections</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.[0]?.total_reflections || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardHeader className="pb-2">
            <CardDescription>Avg Mood</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.[0]?.avg_mood ? (
                <>
                  {MOOD_OPTIONS.find(m => m.value === Math.round(stats[0].avg_mood))?.emoji || ""}{" "}
                  {MOOD_OPTIONS.find(m => m.value === Math.round(stats[0].avg_mood))?.label || "Neutral"}
                </>
              ) : (
                "\u2014"
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-400">
          <CardHeader className="pb-2">
            <CardDescription>Avg Energy</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.[0]?.avg_energy ? `${stats[0].avg_energy}/5` : "\u2014"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.[0]?.streak_days || 0}</p>
            <p className="text-xs text-muted-foreground">sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <TaskList />

      {/* Post-first-reflection insight card */}
      {isEarlyUser && hasInsights && (
        <Card className="border bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
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

      {/* Pattern Preview for free users with enough reflections */}
      {subscriptionTier === "free" && reflections && reflections.length >= 3 && hasInsights && (() => {
        const themes = (recentInsights || []).filter(i => i.insight_type === 'theme')
        if (themes.length === 0) return null
        // Count occurrences of each theme name
        const themeCounts: Record<string, number> = {}
        for (const t of themes) {
          themeCounts[t.name] = (themeCounts[t.name] || 0) + 1
        }
        const topThemeName = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]
        return (
          <PatternPreview
            topTheme={topThemeName[0]}
            themeCount={topThemeName[1]}
            totalReflections={stats?.[0]?.total_reflections || reflections.length}
          />
        )
      })()}

      {/* Voice notes teaser for free users (web only - native uses IAP via settings) */}
      <NativeHidden>
        {subscriptionTier === "free" && (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-medium">
                    Reflect on the drive home
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pro coaches record a 2-minute voice note after every session. The AI transcribes it, pulls out the key themes, and saves it to your coaching library. Hands-free.
                  </p>
                </div>
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    Try Voice Notes Free
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </NativeHidden>

      {/* Drills Card - for football coaches */}
      {(profile?.sport === 'football' || !profile?.sport) && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium">
                  Drill Library
                </p>
                <p className="text-sm text-muted-foreground">
                  Ask for a drill in chat and save it to your library. Animated pitch diagrams included.
                </p>
              </div>
              <Link href="/dashboard/drills">
                <Button variant="outline" size="sm">
                  View Drills
                </Button>
              </Link>
            </div>
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
