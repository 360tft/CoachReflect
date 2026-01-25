import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { MOOD_OPTIONS, SESSION_TYPES } from "@/app/types"

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get all reflections
  const { data: reflections } = await supabase
    .from("reflections")
    .select("*, sessions(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reflection History</h1>
          <p className="text-muted-foreground">
            Browse all your past reflections
          </p>
        </div>
        <Link href="/dashboard/reflect/new">
          <Button>+ New Reflection</Button>
        </Link>
      </div>

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
