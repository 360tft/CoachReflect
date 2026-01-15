'use client'

import { useEffect, useState, useCallback } from 'react'

interface AnalyticsData {
  summary: {
    totalReflections: number
    totalConversations: number
    uniqueActiveUsers7d: number
    uniqueActiveUsers30d: number
    avgReflectionsPerUser: number
    avgConversationsPerUser: number
  }
  reflectionsByDay: Array<{ date: string; count: number }>
  topMoods: Array<{ mood: string; count: number }>
  conversionFunnel: {
    signups: number
    firstReflection: number
    threeReflections: number
    proSubscribed: number
  }
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7d')

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Simple bar chart renderer
  const renderMiniBar = (value: number, max: number) => {
    const width = max > 0 ? Math.round((value / max) * 100) : 0
    return (
      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Analytics
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading analytics...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Reflections</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.summary.totalReflections.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Conversations</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.summary.totalConversations.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users (7d)</p>
              <p className="text-2xl font-bold text-green-600">
                {data.summary.uniqueActiveUsers7d}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users (30d)</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.summary.uniqueActiveUsers30d}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Reflections/User</p>
              <p className="text-2xl font-bold text-amber-600">
                {data.summary.avgReflectionsPerUser.toFixed(1)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Conversations/User</p>
              <p className="text-2xl font-bold text-cyan-600">
                {data.summary.avgConversationsPerUser.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Conversion Funnel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Conversion Funnel</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Signups</span>
                  <span className="font-medium">{data.conversionFunnel.signups}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">First Reflection</span>
                  <div className="flex items-center gap-2">
                    {renderMiniBar(data.conversionFunnel.firstReflection, data.conversionFunnel.signups)}
                    <span className="font-medium">{data.conversionFunnel.firstReflection}</span>
                    <span className="text-xs text-gray-400">
                      ({data.conversionFunnel.signups > 0 ? Math.round((data.conversionFunnel.firstReflection / data.conversionFunnel.signups) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">3+ Reflections</span>
                  <div className="flex items-center gap-2">
                    {renderMiniBar(data.conversionFunnel.threeReflections, data.conversionFunnel.signups)}
                    <span className="font-medium">{data.conversionFunnel.threeReflections}</span>
                    <span className="text-xs text-gray-400">
                      ({data.conversionFunnel.signups > 0 ? Math.round((data.conversionFunnel.threeReflections / data.conversionFunnel.signups) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pro Subscribed</span>
                  <div className="flex items-center gap-2">
                    {renderMiniBar(data.conversionFunnel.proSubscribed, data.conversionFunnel.signups)}
                    <span className="font-medium text-green-600">{data.conversionFunnel.proSubscribed}</span>
                    <span className="text-xs text-gray-400">
                      ({data.conversionFunnel.signups > 0 ? Math.round((data.conversionFunnel.proSubscribed / data.conversionFunnel.signups) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Moods */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Top Moods Recorded</h2>
              </div>
              {data.topMoods.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No mood data yet</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.topMoods.map((item, idx) => {
                    const maxCount = data.topMoods[0]?.count || 1
                    return (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {item.mood}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderMiniBar(item.count, maxCount)}
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Daily Reflections</h2>
            {data.reflectionsByDay.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No activity data yet</div>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {data.reflectionsByDay.map((day, idx) => {
                  const maxCount = Math.max(...data.reflectionsByDay.map(d => d.count), 1)
                  const height = Math.round((day.count / maxCount) * 100)
                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-0 group relative"
                    >
                      <div
                        className="bg-primary rounded-t hover:opacity-80 transition-colors"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {day.date}: {day.count} reflections
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {data.reflectionsByDay.length > 0 && (
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{data.reflectionsByDay[0]?.date}</span>
                <span>{data.reflectionsByDay[data.reflectionsByDay.length - 1]?.date}</span>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
