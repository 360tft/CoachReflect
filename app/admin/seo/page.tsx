'use client'

import { useState, useEffect } from 'react'

interface SearchConsoleQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface SearchConsolePage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface AnalyticsOverview {
  users: number
  sessions: number
  pageviews: number
  avgSessionDuration: number
  bounceRate: number
  newUsers: number
}

interface SEOInsight {
  type: 'opportunity' | 'issue' | 'success'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
  data?: Record<string, unknown>
}

interface SEOData {
  searchConsole?: {
    queries: SearchConsoleQuery[]
    pages: SearchConsolePage[]
    totals: {
      clicks: number
      impressions: number
      ctr: number
      position: number
    }
    dateRange: { startDate: string; endDate: string }
  }
  analytics?: {
    overview: AnalyticsOverview
    topPages: { path: string; pageviews: number; users: number }[]
    topSources: { source: string; medium: string; users: number; sessions: number }[]
  }
  insights?: SEOInsight[]
  searchConsoleError?: string
  analyticsError?: string
}

export default function SEODashboard() {
  const [data, setData] = useState<SEOData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(28)

  useEffect(() => {
    fetchData()
  }, [days])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/seo?days=${days}`)
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const json = await response.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatCTR = (ctr: number) => `${(ctr * 100).toFixed(1)}%`
  const formatPosition = (pos: number) => pos.toFixed(1)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SEO Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Google Search Console & Analytics insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading SEO data...</p>
        </div>
      ) : (
        <>
          {/* Insights */}
          {data?.insights && data.insights.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                SEO Insights & Actions
              </h2>
              <div className="grid gap-4">
                {data.insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'opportunity'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                        : insight.type === 'issue'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            insight.priority === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                              : insight.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {insight.priority}
                        </span>
                        <h3 className="font-semibold mt-2 text-gray-900 dark:text-white">{insight.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                        {insight.action && (
                          <p className="text-sm text-primary mt-2">Action: {insight.action}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Overview */}
          {data?.analytics && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Analytics Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary">{data.analytics.overview.users.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Users</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary">{data.analytics.overview.newUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">New Users</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary">{data.analytics.overview.sessions.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Sessions</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary">{data.analytics.overview.pageviews.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Page Views</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary">{formatDuration(data.analytics.overview.avgSessionDuration)}</div>
                  <div className="text-sm text-gray-500">Avg Session</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary">{(data.analytics.overview.bounceRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Bounce Rate</div>
                </div>
              </div>
            </div>
          )}

          {data?.analyticsError && (
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg">
              <strong>Analytics:</strong> {data.analyticsError}
            </div>
          )}

          {/* Search Console Overview */}
          {data?.searchConsole && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Search Console ({data.searchConsole.dateRange.startDate} to {data.searchConsole.dateRange.endDate})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{data.searchConsole.totals.clicks.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Clicks</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">{data.searchConsole.totals.impressions.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Impressions</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{formatCTR(data.searchConsole.totals.ctr)}</div>
                  <div className="text-sm text-gray-500">Avg CTR</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-amber-600">{formatPosition(data.searchConsole.totals.position)}</div>
                  <div className="text-sm text-gray-500">Avg Position</div>
                </div>
              </div>

              {/* Top Queries */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Top Search Queries</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Query</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Clicks</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Impressions</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CTR</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.searchConsole.queries.slice(0, 20).map((query, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{query.query}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{query.clicks}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{query.impressions}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{formatCTR(query.ctr)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{formatPosition(query.position)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Pages */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Top Pages</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Page</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Clicks</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Impressions</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CTR</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.searchConsole.pages.slice(0, 15).map((page, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white truncate max-w-xs" title={page.page}>
                            {page.page.replace('https://coachreflection.com', '')}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{page.clicks}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{page.impressions}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{formatCTR(page.ctr)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{formatPosition(page.position)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {data?.searchConsoleError && (
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg">
              <strong>Search Console:</strong> {data.searchConsoleError}
            </div>
          )}

          {/* Traffic Sources */}
          {data?.analytics?.topSources && data.analytics.topSources.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Traffic Sources
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Source / Medium</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Users</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sessions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.analytics.topSources.map((source, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {source.source} / {source.medium}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{source.users}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{source.sessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
