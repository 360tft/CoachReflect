'use client'

import { useState, useEffect, useCallback } from 'react'
import { DrillSchema } from '@/lib/drill-schema'
import { DrillCard } from './drill-card'
import { DrillDetailModal } from './drill-detail-modal'

interface SavedDrill {
  id: string
  share_id: string
  name: string
  description: string | null
  category: string
  age_group: string | null
  type: string
  set_piece_type: string | null
  drill_data: DrillSchema
  is_favourite: boolean
  view_count: number
  created_at: string
  updated_at: string
}

interface DrillLibraryProps {
  isPro: boolean
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'technical', label: 'Technical' },
  { value: 'tactical', label: 'Tactical' },
  { value: 'physical', label: 'Physical' },
  { value: 'psychological', label: 'Psychological' },
  { value: 'small-sided-game', label: 'Small-Sided Game' },
  { value: 'set-piece', label: 'Set Piece' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'drill', label: 'Drills' },
  { value: 'set-piece', label: 'Set Pieces' },
]

export function DrillLibrary({ isPro }: DrillLibraryProps) {
  const [drills, setDrills] = useState<SavedDrill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDrill, setSelectedDrill] = useState<SavedDrill | null>(null)

  // Filters
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('all')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchDrills = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (type !== 'all') params.set('type', type)
      if (favouritesOnly) params.set('favourite', 'true')
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/drills?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch drills')
      }

      const data = await res.json()
      setDrills(data.drills || [])
    } catch (err) {
      setError('Failed to load drills. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [category, type, favouritesOnly, debouncedSearch])

  useEffect(() => {
    if (isPro) {
      fetchDrills()
    } else {
      setLoading(false)
    }
  }, [fetchDrills, isPro])

  const handleFavouriteToggle = async (id: string, isFavourite: boolean) => {
    // Optimistic update
    setDrills(prev =>
      prev.map(d => (d.id === id ? { ...d, is_favourite: isFavourite } : d))
    )
    if (selectedDrill?.id === id) {
      setSelectedDrill(prev => prev ? { ...prev, is_favourite: isFavourite } : null)
    }

    try {
      const res = await fetch(`/api/drills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavourite }),
      })
      if (!res.ok) {
        // Revert on failure
        setDrills(prev =>
          prev.map(d => (d.id === id ? { ...d, is_favourite: !isFavourite } : d))
        )
        if (selectedDrill?.id === id) {
          setSelectedDrill(prev => prev ? { ...prev, is_favourite: !isFavourite } : null)
        }
      }
    } catch {
      // Revert on failure
      setDrills(prev =>
        prev.map(d => (d.id === id ? { ...d, is_favourite: !isFavourite } : d))
      )
    }
  }

  const handleDelete = (id: string) => {
    setDrills(prev => prev.filter(d => d.id !== id))
    setSelectedDrill(null)
  }

  // Not Pro - show upgrade card
  if (!isPro) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 text-center">
            Drill Library
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
            Your saved drills and set pieces
          </p>
        </div>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Your Drill Library
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Ask for any drill in chat — passing, pressing, set pieces — and save it here with animated pitch diagrams. Pro coaches build a library they can search forever.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-flex items-center min-h-[44px] px-6 py-2 bg-[#E5A11C] hover:bg-[#d4940f] text-white font-medium rounded-lg transition-colors"
          >
            Try Pro Free for 7 Days
          </a>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 text-center">
          Drill Library
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
          Your saved drills and set pieces
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Category dropdown */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="min-h-[44px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E5A11C] focus:border-transparent"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Type toggle */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {TYPE_OPTIONS.map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`min-h-[44px] px-4 py-2 text-sm font-medium transition-colors ${
                type === t.value
                  ? 'bg-[#E5A11C] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Favourites checkbox */}
        <label className="flex items-center gap-2 min-h-[44px] px-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={favouritesOnly}
            onChange={e => setFavouritesOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#E5A11C] focus:ring-[#E5A11C]"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Favourites</span>
        </label>

        {/* Search input */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drills..."
            className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#E5A11C] focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="w-[150px] h-[150px] bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDrills}
            className="min-h-[44px] px-4 py-2 bg-[#E5A11C] hover:bg-[#d4940f] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && drills.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008H15.75V18zm-6 0h.008v.008H9.75V18zm0-3h.008v.008H9.75V15zm3 0h.008v.008H12.75V15z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No drills found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {debouncedSearch || category !== 'all' || type !== 'all' || favouritesOnly
              ? 'Try adjusting your filters or search term.'
              : 'Drills you save from chat will appear here. Ask your reflection partner to create a drill for you.'}
          </p>
        </div>
      )}

      {/* Drill grid */}
      {!loading && !error && drills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drills.map(drill => (
            <DrillCard
              key={drill.id}
              drill={drill}
              onFavouriteToggle={handleFavouriteToggle}
              onClick={() => setSelectedDrill(drill)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedDrill && (
        <DrillDetailModal
          drill={selectedDrill}
          isOpen={true}
          onClose={() => setSelectedDrill(null)}
          onDelete={handleDelete}
          onFavouriteToggle={handleFavouriteToggle}
        />
      )}
    </>
  )
}
