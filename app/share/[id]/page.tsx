import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { MOOD_OPTIONS } from '@/app/types'

interface Props {
  params: Promise<{ id: string }>
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: share } = await supabase
    .from('shared_reflections')
    .select(`
      share_excerpt,
      reflections (
        date,
        mood_rating,
        what_worked,
        what_didnt_work,
        player_observations,
        sessions (title)
      )
    `)
    .eq('share_id', id)
    .eq('is_active', true)
    .single()

  if (!share || !share.reflections) {
    return {
      title: 'Share Not Found | CoachReflect',
    }
  }

  // Handle reflections as the joined data
  const reflection = share.reflections as unknown as {
    date: string
    mood_rating: number
    what_worked: string | null
    what_didnt_work: string | null
    player_observations: string | null
    sessions: { title: string } | null
  }

  const sessionTitle = reflection.sessions?.title || 'Coaching Reflection'
  const date = new Date(reflection.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const excerpt = share.share_excerpt || reflection.what_worked || 'A coaching reflection'
  const truncatedExcerpt = excerpt.length > 200 ? excerpt.slice(0, 200) + '...' : excerpt

  const title = `${sessionTitle} - ${date} | CoachReflect`
  const description = truncatedExcerpt

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'CoachReflect',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function SharedReflectionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the shared reflection
  const { data: share, error } = await supabase
    .from('shared_reflections')
    .select(`
      *,
      reflections (
        id,
        date,
        mood_rating,
        energy_rating,
        what_worked,
        what_didnt_work,
        player_observations,
        next_session_focus,
        ai_summary,
        sessions (title, session_type)
      )
    `)
    .eq('share_id', id)
    .eq('is_active', true)
    .single()

  if (error || !share || !share.reflections) {
    notFound()
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound()
  }

  // Handle reflections as the joined data
  const reflection = share.reflections as unknown as {
    id: string
    date: string
    mood_rating: number
    energy_rating: number
    what_worked: string | null
    what_didnt_work: string | null
    player_observations: string | null
    next_session_focus: string | null
    ai_summary: string | null
    sessions: { title: string; session_type: string } | null
  }

  // Increment view count (fire and forget)
  supabase
    .from('shared_reflections')
    .update({ view_count: share.view_count + 1 })
    .eq('id', share.id)
    .then(() => {})

  const moodOption = MOOD_OPTIONS.find(m => m.value === reflection.mood_rating)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background">
      {/* Header */}
      <header className="bg-amber-600 text-white py-6">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
              mirror symbol
            </div>
            <div>
              <h1 className="text-xl font-bold">CoachReflect</h1>
              <p className="text-sm opacity-80">AI-Powered Coaching Reflections</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Session info */}
          <div className="border-b border-amber-200 dark:border-amber-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">
                  {reflection.sessions?.session_type || 'Session'} Reflection
                </p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {reflection.sessions?.title || 'Coaching Reflection'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(reflection.date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl">{moodOption?.emoji || 'mood emoji'}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {moodOption?.label || 'Okay'}
                </p>
              </div>
            </div>
          </div>

          {/* Reflection content */}
          <div className="p-6 space-y-6">
            {/* AI Summary if exists */}
            {reflection.ai_summary && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  AI Summary
                </p>
                <p className="text-gray-700 dark:text-gray-300">{reflection.ai_summary}</p>
              </div>
            )}

            {/* What worked */}
            {reflection.what_worked && (
              <div>
                <h3 className="text-sm font-semibold text-green-600 mb-2">What Worked Well</h3>
                <p className="text-gray-700 dark:text-gray-300">{reflection.what_worked}</p>
              </div>
            )}

            {/* What didn't work */}
            {reflection.what_didnt_work && (
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-2">Areas for Improvement</h3>
                <p className="text-gray-700 dark:text-gray-300">{reflection.what_didnt_work}</p>
              </div>
            )}

            {/* Player observations */}
            {reflection.player_observations && (
              <div>
                <h3 className="text-sm font-semibold text-blue-600 mb-2">Player Observations</h3>
                <p className="text-gray-700 dark:text-gray-300">{reflection.player_observations}</p>
              </div>
            )}

            {/* Next focus */}
            {reflection.next_session_focus && (
              <div>
                <h3 className="text-sm font-semibold text-purple-600 mb-2">Next Session Focus</h3>
                <p className="text-gray-700 dark:text-gray-300">{reflection.next_session_focus}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Shared via CoachReflect
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Start Your Own Journal
              </Link>
            </div>
          </div>
        </div>

        {/* View count */}
        <div className="mt-4 text-center text-sm text-gray-400">
          {share.view_count > 0 && `${share.view_count.toLocaleString()} view${share.view_count === 1 ? '' : 's'}`}
        </div>
      </main>

      {/* Bottom CTA */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reflect. Grow. Coach Better.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            CoachReflect helps football coaches capture post-session thoughts,
            track patterns, and get AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
            >
              Start Free
            </Link>
            <Link
              href="/"
              className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
