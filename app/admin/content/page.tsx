"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface ThemeData {
  name: string
  count: number
  recent_snippets: string[]
}

interface TopReflection {
  id: string
  date: string
  what_worked: string | null
  what_didnt_work: string | null
  player_standouts: string | null
  ai_summary: string | null
  mood_label: string
  energy_rating: number | null
  tags: string[]
}

interface ContentData {
  period: string
  total_reflections: number
  total_conversations: number
  themes: ThemeData[]
  common_challenges: string[]
  top_reflections: TopReflection[]
}

export default function ContentMiningPage() {
  const [data, setData] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("7")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchContent()
  }, [period])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/content?days=${period}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to fetch content")
        return
      }

      setData(result)
      setError(null)
    } catch {
      setError("Failed to load content data")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const anonymizeText = (text: string): string => {
    // Replace common name patterns with [Player]
    return text
      .replace(/\b[A-Z][a-z]+\b(?=\s+(was|is|did|played|scored|showed|struggled|improved|needs))/g, "[Player]")
      .replace(/\b(my|the)\s+(son|daughter|kid|child)\b/gi, "[Player]")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Mining</h1>
          <p className="text-muted-foreground">
            Review anonymized themes and reflections for email/blog content
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Warning Banner */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardContent className="py-4">
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            <strong>Privacy Notice:</strong> All content here is anonymized automatically, but please review before using in any public content. Remove any identifying details you spot.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Mining content...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{data.total_reflections}</p>
                <p className="text-sm text-muted-foreground">Reflections</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{data.total_conversations}</p>
                <p className="text-sm text-muted-foreground">Conversations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{data.themes.length}</p>
                <p className="text-sm text-muted-foreground">Unique Themes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{data.common_challenges.length}</p>
                <p className="text-sm text-muted-foreground">Challenges Identified</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Coaching Themes</CardTitle>
              <CardDescription>
                Most discussed topics - great for newsletter content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.themes.length === 0 ? (
                <p className="text-muted-foreground">No themes found in this period.</p>
              ) : (
                <div className="space-y-4">
                  {data.themes.map((theme, i) => (
                    <div key={theme.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold capitalize">
                            {theme.name.replace(/_/g, " ")}
                          </span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {theme.count} mentions
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(
                            `Theme: ${theme.name.replace(/_/g, " ")}\nMentions: ${theme.count}\n\nExample snippets:\n${theme.recent_snippets.map(s => `- ${anonymizeText(s)}`).join("\n")}`,
                            `theme-${i}`
                          )}
                        >
                          {copiedId === `theme-${i}` ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      {theme.recent_snippets.length > 0 && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="font-medium">Recent mentions:</p>
                          {theme.recent_snippets.slice(0, 3).map((snippet, j) => (
                            <p key={j} className="pl-4 border-l-2 border-muted">
                              &quot;{anonymizeText(snippet)}&quot;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Common Challenges */}
          <Card>
            <CardHeader>
              <CardTitle>Common Challenges</CardTitle>
              <CardDescription>
                What coaches are struggling with - great for blog posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.common_challenges.length === 0 ? (
                <p className="text-muted-foreground">No challenges identified in this period.</p>
              ) : (
                <div className="space-y-2">
                  {data.common_challenges.map((challenge, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <p className="text-sm">{anonymizeText(challenge)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(anonymizeText(challenge), `challenge-${i}`)}
                      >
                        {copiedId === `challenge-${i}` ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Reflections */}
          <Card>
            <CardHeader>
              <CardTitle>Notable Reflections (Anonymized)</CardTitle>
              <CardDescription>
                Detailed reflections that could inspire newsletter content. All identifying information removed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.top_reflections.length === 0 ? (
                <p className="text-muted-foreground">No reflections found in this period.</p>
              ) : (
                <div className="space-y-4">
                  {data.top_reflections.map((reflection, i) => (
                    <div key={reflection.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{reflection.mood_label}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reflection.date).toLocaleDateString()}
                          </span>
                          {reflection.tags.length > 0 && (
                            <div className="flex gap-1">
                              {reflection.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-muted text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const content = [
                              reflection.what_worked && `What worked: ${anonymizeText(reflection.what_worked)}`,
                              reflection.what_didnt_work && `Challenges: ${anonymizeText(reflection.what_didnt_work)}`,
                              reflection.player_standouts && `Player notes: ${anonymizeText(reflection.player_standouts)}`,
                              reflection.ai_summary && `Summary: ${anonymizeText(reflection.ai_summary)}`,
                            ].filter(Boolean).join("\n\n")
                            copyToClipboard(content, `reflection-${i}`)
                          }}
                        >
                          {copiedId === `reflection-${i}` ? "Copied!" : "Copy All"}
                        </Button>
                      </div>

                      <div className="space-y-3 text-sm">
                        {reflection.what_worked && (
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">What worked:</p>
                            <p className="text-muted-foreground">{anonymizeText(reflection.what_worked)}</p>
                          </div>
                        )}
                        {reflection.what_didnt_work && (
                          <div>
                            <p className="font-medium text-orange-700 dark:text-orange-400">Challenges:</p>
                            <p className="text-muted-foreground">{anonymizeText(reflection.what_didnt_work)}</p>
                          </div>
                        )}
                        {reflection.ai_summary && (
                          <div>
                            <p className="font-medium text-blue-700 dark:text-blue-400">AI Summary:</p>
                            <p className="text-muted-foreground">{anonymizeText(reflection.ai_summary)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
