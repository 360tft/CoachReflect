"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import Link from "next/link"

interface PlayerMention {
  date: string
  sentiment: 'positive' | 'concern' | 'neutral'
  context: string
  conversation_id?: string
}

interface PlayerNote {
  id: string
  note: string
  category: string
  created_at: string
}

interface PlayerAnalytics {
  player_name: string
  total_mentions: number
  sentiment_breakdown: {
    positive: number
    concern: number
    neutral: number
  }
  sentiment_trend: 'improving' | 'declining' | 'stable'
  first_mentioned: string | null
  last_mentioned: string | null
  mentions: PlayerMention[]
  related_themes: { theme: string; count: number }[]
  notes: PlayerNote[]
}

interface PlayerDetailClientProps {
  playerName: string
}

export function PlayerDetailClient({ playerName }: PlayerDetailClientProps) {
  const [data, setData] = useState<PlayerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState("")
  const [noteCategory, setNoteCategory] = useState<string>("general")
  const [savingNote, setSavingNote] = useState(false)

  const displayName = playerName.charAt(0).toUpperCase() + playerName.slice(1)

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const res = await fetch(`/api/analytics/player/${encodeURIComponent(playerName)}`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to fetch player")
        }
        const analytics = await res.json()
        setData(analytics)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load player")
      } finally {
        setLoading(false)
      }
    }

    fetchPlayer()
  }, [playerName])

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setSavingNote(true)
    try {
      const res = await fetch("/api/player-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: playerName,
          note: newNote,
          category: noteCategory,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save note")
      }

      const { note } = await res.json()

      // Add to local state
      setData(prev => prev ? {
        ...prev,
        notes: [note, ...prev.notes],
      } : null)

      setNewNote("")
    } catch {
      alert("Failed to save note")
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/player-notes?id=${noteId}`, { method: "DELETE" })
      setData(prev => prev ? {
        ...prev,
        notes: prev.notes.filter(n => n.id !== noteId),
      } : null)
    } catch {
      alert("Failed to delete note")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-destructive mb-4">{error || "Player not found"}</p>
          <Link href="/dashboard/players">
            <Button variant="outline">Back to Players</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500'
      case 'concern': return 'text-primary-foreground0'
      default: return 'text-gray-400'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↗'
      case 'declining': return '↘'
      default: return '→'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-500'
      case 'declining': return 'text-primary-foreground0'
      default: return 'text-muted-foreground'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'bg-green-500/10 border-green-500/20 text-green-600'
      case 'development': return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
      case 'concern': return 'bg-muted/500/10 border-primary/20 text-primary'
      case 'goal': return 'bg-purple-500/10 border-purple-500/20 text-purple-600'
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/players">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">
            {data.total_mentions} mention{data.total_mentions !== 1 ? 's' : ''} since {data.first_mentioned ? new Date(data.first_mentioned).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.total_mentions}</div>
            <p className="text-sm text-muted-foreground">Total Mentions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${getTrendColor(data.sentiment_trend)}`}>
              {getTrendIcon(data.sentiment_trend)} {data.sentiment_trend}
            </div>
            <p className="text-sm text-muted-foreground">Sentiment Trend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{data.sentiment_breakdown.positive}</div>
            <p className="text-sm text-muted-foreground">Positive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary-foreground0">{data.sentiment_breakdown.concern}</div>
            <p className="text-sm text-muted-foreground">Concerns</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-green-500">Positive ({data.sentiment_breakdown.positive})</span>
            <span className="text-primary-foreground0">Concern ({data.sentiment_breakdown.concern})</span>
            <span className="text-gray-500">Neutral ({data.sentiment_breakdown.neutral})</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 h-full"
              style={{ width: `${(data.sentiment_breakdown.positive / data.total_mentions) * 100}%` }}
            />
            <div
              className="bg-muted/500 h-full"
              style={{ width: `${(data.sentiment_breakdown.concern / data.total_mentions) * 100}%` }}
            />
            <div className="bg-gray-400 h-full flex-1" />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Related Themes */}
        <Card>
          <CardHeader>
            <CardTitle>Related Themes</CardTitle>
            <CardDescription>Topics discussed when mentioning {displayName}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.related_themes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No themes extracted yet</p>
            ) : (
              <div className="space-y-2">
                {data.related_themes.map((theme, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="capitalize">{theme.theme}</span>
                    <span className="text-sm text-muted-foreground">{theme.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Note */}
        <Card>
          <CardHeader>
            <CardTitle>Add a Note</CardTitle>
            <CardDescription>Track observations about {displayName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`What have you noticed about ${displayName}?`}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 flex-wrap">
              {['general', 'strength', 'development', 'concern', 'goal'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNoteCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    noteCategory === cat ? getCategoryColor(cat) : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || savingNote}
              className="bg-brand hover:bg-brand-hover w-full"
            >
              {savingNote ? "Saving..." : "Add Note"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Existing Notes */}
      {data.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Your observations about {displayName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.notes.map((note) => (
              <div key={note.id} className={`p-3 rounded-lg border ${getCategoryColor(note.category)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs uppercase font-medium">{note.category}</span>
                    <p className="mt-1">{note.note}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Delete note"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Mention Timeline</CardTitle>
          <CardDescription>Every time you mentioned {displayName}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.mentions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No mentions found</p>
          ) : (
            <div className="space-y-4">
              {data.mentions.map((mention, i) => (
                <div key={i} className="flex gap-4 items-start border-l-2 border-muted pl-4 pb-4">
                  <div className={`w-3 h-3 rounded-full mt-1 -ml-[1.4rem] ${
                    mention.sentiment === 'positive' ? 'bg-green-500' :
                    mention.sentiment === 'concern' ? 'bg-muted/500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {new Date(mention.date).toLocaleDateString()}
                      </span>
                      <span className={`text-xs ${getSentimentColor(mention.sentiment)}`}>
                        {mention.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mention.context}
                    </p>
                    {mention.conversation_id && (
                      <Link
                        href={`/dashboard/chat?conversation=${mention.conversation_id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        View conversation →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
