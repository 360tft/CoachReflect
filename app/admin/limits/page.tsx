'use client'

import { useState, useEffect } from 'react'

interface LimitHit {
  id: string
  user_id: string
  user_email: string | null
  hit_date: string
  limit_type: string
  daily_limit: number
  created_at: string
}

interface PowerUser {
  user_id: string
  email: string | null
  times_hit: number
}

interface Stats {
  total_hits: number
  unique_users_all_time: number
  unique_users_last_30_days: number
  power_users: PowerUser[]
}

export default function AdminLimitsPage() {
  const [hits, setHits] = useState<LimitHit[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/limit-hits')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch data')
        return
      }

      setHits(data.hits || [])
      setStats(data.stats || null)
      setError(null)
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <h1 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Error</h1>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usage Limit Monitor</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track users hitting their daily limits - potential Pro upgrade candidates
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="text-3xl font-bold text-blue-600">{stats.total_hits}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Limit Hits</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="text-3xl font-bold text-purple-600">{stats.unique_users_all_time}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Unique Users (All Time)</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-600">{stats.unique_users_last_30_days}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Unique Users (Last 30 Days)</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-primary">
                <div className="text-3xl font-bold text-primary">{stats.power_users.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Power Users (3+ hits)</div>
                <div className="text-xs text-primary mt-1">Pro upgrade candidates!</div>
              </div>
            </div>
          )}

          {/* Alert Banner */}
          {stats && stats.unique_users_last_30_days >= 5 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-400 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    Conversion Opportunity!
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {stats.unique_users_last_30_days} users have hit their limit in the last 30 days.
                    Consider targeted outreach for Pro upgrades.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Power Users Table */}
          {stats && stats.power_users.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Power Users - Pro Upgrade Candidates
                </h2>
                <p className="text-sm text-gray-500">Users who have hit the limit 3+ times</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Times Hit Limit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.power_users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {user.email || user.user_id.slice(0, 8) + '...'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-primary">
                          {user.times_hit}x
                        </td>
                        <td className="px-4 py-3">
                          {user.times_hit >= 10 ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-full">
                              Very High
                            </span>
                          ) : user.times_hit >= 5 ? (
                            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                              High
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                              Medium
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Hits List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Limit Hits</h2>
            </div>
            {hits.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No users have hit their limit yet.</p>
                <p className="text-sm mt-2">This data will populate as free users hit their daily message limits.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {hits.map((hit) => (
                      <tr key={hit.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {new Date(hit.hit_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {hit.user_email || hit.user_id.slice(0, 8) + '...'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {hit.limit_type || 'messages'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {hit.daily_limit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
