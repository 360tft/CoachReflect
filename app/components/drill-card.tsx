'use client'

import dynamic from 'next/dynamic'
import { DrillSchema } from '@/lib/drill-schema'

const DrillAnimation = dynamic(
  () => import('./drill-animation').then(mod => mod.DrillAnimation),
  {
    ssr: false,
    loading: () => (
      <div className="w-[150px] h-[150px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    ),
  }
)

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

interface DrillCardProps {
  drill: SavedDrill
  onFavouriteToggle: (id: string, isFavourite: boolean) => void
  onClick: () => void
  hideFavourite?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  tactical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  physical: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  psychological: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'small-sided-game': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'set-piece': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

function formatCategory(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatSetPieceType(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function DrillCard({ drill, onFavouriteToggle, onClick, hideFavourite }: DrillCardProps) {
  const handleFavouriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavouriteToggle(drill.id, !drill.is_favourite)
  }

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-[#E5A11C] dark:hover:border-[#E5A11C] hover:shadow-md transition-all group"
    >
      {/* Animation preview */}
      <div className="flex justify-center mb-3">
        <DrillAnimation
          drill={drill.drill_data}
          width={150}
          height={150}
          autoPlay={false}
          showControls={false}
          responsive={false}
        />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-2 group-hover:text-[#E5A11C] transition-colors">
        {drill.name}
      </h3>

      {/* Badges and favourite */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {/* Category badge */}
          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${CATEGORY_COLORS[drill.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
            {formatCategory(drill.category)}
          </span>

          {/* Age group badge */}
          {drill.age_group && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {drill.age_group}
            </span>
          )}

          {/* Set piece type badge */}
          {drill.set_piece_type && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {formatSetPieceType(drill.set_piece_type)}
            </span>
          )}
        </div>

        {/* Favourite toggle */}
        {!hideFavourite && (
          <button
            onClick={handleFavouriteClick}
            className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={drill.is_favourite ? 'Remove from favourites' : 'Add to favourites'}
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                drill.is_favourite
                  ? 'text-red-500 fill-red-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-red-400'
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              fill={drill.is_favourite ? 'currentColor' : 'none'}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
