import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { MOOD_OPTIONS, ENERGY_OPTIONS, SESSION_TYPES, GUIDED_PROMPTS } from "@/app/types"
import { AnalyzeButton } from "./analyze-button"
import { DeleteButton } from "./delete-button"
import { ShareButton } from "@/app/components/share-button"

export default async function ReflectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: reflection, error } = await supabase
    .from("reflections")
    .select("*, sessions(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !reflection) {
    notFound()
  }

  // Get profile for subscription check
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .single()

  const isPro = profile?.subscription_tier !== "free"
  const mood = MOOD_OPTIONS.find((m) => m.value === reflection.mood_rating)
  const energy = ENERGY_OPTIONS.find((e) => e.value === reflection.energy_rating)
  const sessionType = SESSION_TYPES.find((t) => t.id === reflection.sessions?.session_type)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{mood?.emoji || "😐"}</span>
            <h1 className="text-2xl font-bold">
              {reflection.sessions?.title || "Untitled Session"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {new Date(reflection.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {sessionType && (
              <Badge variant="secondary">
                {sessionType.emoji} {sessionType.label}
              </Badge>
            )}
            {reflection.sessions?.duration_minutes && (
              <span>• {reflection.sessions.duration_minutes} mins</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ShareButton reflectionId={reflection.id} />
          <DeleteButton id={reflection.id} />
        </div>
      </div>

      {/* AI Analysis Section */}
      {reflection.ai_summary ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>✨</span> AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-1">Summary</p>
              <p className="text-muted-foreground">{reflection.ai_summary}</p>
            </div>
            {reflection.ai_insights && (
              <div>
                <p className="font-medium mb-1">Insights</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {reflection.ai_insights.split("\n").map((insight: string, i: number) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            {reflection.ai_action_items && reflection.ai_action_items.length > 0 && (
              <div>
                <p className="font-medium mb-1">Action Items</p>
                <ul className="space-y-2">
                  {reflection.ai_action_items.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : isPro ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Get AI-powered insights for this reflection
            </p>
            <AnalyzeButton id={reflection.id} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="py-6 text-center">
            <p className="text-amber-800 dark:text-amber-200 mb-4">
              Upgrade to Pro to get AI-powered insights for your reflections
            </p>
            <Link href="/dashboard/settings">
              <Button variant="outline">Upgrade to Pro</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Ratings */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Mood</p>
            <span className="text-3xl">{mood?.emoji || "😐"}</span>
            <p className="text-sm">{mood?.label || "Not rated"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Energy</p>
            <span className="text-3xl">{energy?.emoji || "⚡"}</span>
            <p className="text-sm">{energy?.label || "Not rated"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reflection Content */}
      <Card>
        <CardHeader>
          <CardTitle>Reflection Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {GUIDED_PROMPTS.map((prompt) => {
            const value =
              prompt.id === "what_worked" ? reflection.what_worked :
              prompt.id === "what_didnt_work" ? reflection.what_didnt_work :
              prompt.id === "player_standouts" ? reflection.player_standouts :
              prompt.id === "areas_to_improve" ? reflection.areas_to_improve :
              reflection.next_focus

            if (!value) return null

            return (
              <div key={prompt.id}>
                <p className="font-medium mb-1">{prompt.question}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{value}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Tags */}
      {reflection.tags && reflection.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reflection.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Link href="/dashboard/history">
          <Button variant="outline">← Back to History</Button>
        </Link>
        <Link href="/dashboard/reflect/new">
          <Button>New Reflection</Button>
        </Link>
      </div>
    </div>
  )
}
