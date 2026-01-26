import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { MOOD_OPTIONS, SESSION_TYPES } from "@/app/types"
import { LIMITS } from "@/lib/config"

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get profile to check subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .single()

  const tier = profile?.subscription_tier || "free"
  const isSubscribed = tier !== "free"
  const historyDays = isSubscribed ? LIMITS.PRO.historyDays : LIMITS.FREE.historyDays

  // Calculate date filter for free users
  const dateFilter = isSubscribed ? null : new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000).toISOString()

  // Get reflections (filtered by date for free users)
  let query = supabase
    .from("reflections")
    .select("*, sessions(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  if (dateFilter) {
    query = query.gte("date", dateFilter.split("T")[0])
  }

  const { data: reflections } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reflection History</h1>
          <p className="text-muted-foreground">
            {isSubscribed
              ? "Browse all your past reflections"
              : `Showing last ${historyDays} days`}
          </p>
        </div>
        <Link href="/dashboard/reflect/new">
          <Button>+ New Reflection</Button>
        </Link>
      </div>

      {/* Upsell banner for free users */}
      {!isSubscribed && (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold">
                  Free Plan: Limited to last {historyDays} days
                </p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro to access your full reflection history and track patterns over time.
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button className="bg-brand hover:bg-brand-hover whitespace-nowrap" size="sm">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {reflections && reflections.length > 0 ? (
        <div className="space-y-4">
          {reflections.map((reflection) => {
            const sessionType = SESSION_TYPES.find(
              (t) => t.id === reflection.sessions?.session_type
            )
            const mood = MOOD_OPTIONS.find((m) => m.value === reflection.mood_rating)

            return (
              <Link
                key={reflection.id}
                href={`/dashboard/reflect/${reflection.id}`}
                className="block"
              >
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="text-sm font-medium">{mood?.label || "Neutral"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {reflection.sessions?.title || "Untitled Session"}
                          </span>
                          {sessionType && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {sessionType.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reflection.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {reflection.what_worked && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {reflection.what_worked}
                          </p>
                        )}
                        {reflection.tags && reflection.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {reflection.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="text-xs bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary px-2 py-0.5 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {reflection.ai_summary && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="text-xs font-medium text-muted-foreground">AI Summary: </span>
                            {reflection.ai_summary}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Energy: {reflection.energy_rating}/5
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No reflections yet. Start your coaching journey!
            </p>
            <Link href="/dashboard/reflect/new">
              <Button>Create Your First Reflection</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
