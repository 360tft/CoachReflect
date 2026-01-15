'use client'

import { useEffect, useState, useCallback } from 'react'

interface Feedback {
  id: string
  user_id: string
  message_content: string
  response_content: string
  rating: 'positive' | 'negative'
  comment: string | null
  created_at: string
  user_email: string
  user_name: string
}

interface Counts {
  positive: number
  negative: number
  total: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filter && { rating: filter }),
      })
      const res = await fetch(`/api/admin/feedback?${params}`)
      if (!res.ok) throw new Error('Failed to fetch feedback')
      const data = await res.json()
      setFeedback(data.feedback)
      setCounts(data.counts)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Feedback
      </h1>

      {/* Stats */}
      {counts && (
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setFilter(''); setPage(1); }}
            className={`px-4 py-2 rounded-lg ${
              filter === ''
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All ({counts.total})
          </button>
          <button
            onClick={() => { setFilter('positive'); setPage(1); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              filter === 'positive'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Positive ({counts.positive})
          </button>
          <button
            onClick={() => { setFilter('negative'); setPage(1); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              filter === 'negative'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Negative ({counts.negative})
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
          Error: {error}
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : feedback.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500">
            No feedback found
          </div>
        ) : (
          feedback.map(f => (
            <div
              key={f.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    f.rating === 'positive'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {f.rating === 'positive' ? 'Positive' : 'Negative'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {f.user_name} ({f.user_email})
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(f.created_at).toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    User asked:
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {f.message_content.slice(0, 200)}
                    {f.message_content.length > 200 && '...'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    AI responded:
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {f.response_content.slice(0, 300)}
                    {f.response_content.length > 300 && '...'}
                  </p>
                </div>

                {f.comment && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      User comment:
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 italic bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      &quot;{f.comment}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
