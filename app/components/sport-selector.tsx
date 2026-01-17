"use client"

import { useState } from "react"

export interface Sport {
  id: string
  name: string
  icon: string
}

export const SPORTS: Sport[] = [
  { id: "football", name: "Football (Soccer)", icon: "⚽" },
  { id: "rugby", name: "Rugby", icon: "🏉" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
  { id: "hockey", name: "Hockey", icon: "🏑" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "cricket", name: "Cricket", icon: "🏏" },
  { id: "volleyball", name: "Volleyball", icon: "🏐" },
  { id: "baseball", name: "Baseball", icon: "⚾" },
  { id: "american_football", name: "American Football", icon: "🏈" },
  { id: "swimming", name: "Swimming", icon: "🏊" },
  { id: "athletics", name: "Athletics / Track & Field", icon: "🏃" },
  { id: "gymnastics", name: "Gymnastics", icon: "🤸" },
  { id: "martial_arts", name: "Martial Arts", icon: "🥋" },
  { id: "other", name: "Other Sport", icon: "🏆" },
]

interface SportSelectorProps {
  value?: string
  onChange: (sportId: string) => void
  disabled?: boolean
  variant?: "grid" | "dropdown"
}

export function SportSelector({
  value,
  onChange,
  disabled = false,
  variant = "grid",
}: SportSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === "dropdown") {
    const selectedSport = SPORTS.find((s) => s.id === value)

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-left disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            {selectedSport ? (
              <>
                <span className="text-xl">{selectedSport.icon}</span>
                <span className="text-white">{selectedSport.name}</span>
              </>
            ) : (
              <span className="text-gray-400">Select your sport</span>
            )}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-2 bg-dark-card border border-dark-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {SPORTS.map((sport) => (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => {
                    onChange(sport.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-border/50 transition-colors ${
                    value === sport.id ? "bg-brand/10 text-brand" : "text-white"
                  }`}
                >
                  <span className="text-xl">{sport.icon}</span>
                  <span>{sport.name}</span>
                  {value === sport.id && (
                    <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Grid variant - for onboarding
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          type="button"
          onClick={() => !disabled && onChange(sport.id)}
          disabled={disabled}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            value === sport.id
              ? "bg-brand/10 border-brand text-brand"
              : "bg-dark-card border-dark-border text-white hover:border-brand/50"
          }`}
        >
          <span className="text-3xl">{sport.icon}</span>
          <span className="text-sm text-center font-medium">{sport.name}</span>
        </button>
      ))}
    </div>
  )
}

// Simple inline selector for compact UI
export function SportBadge({ sportId }: { sportId: string }) {
  const sport = SPORTS.find((s) => s.id === sportId)
  if (!sport) return null

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-dark-card border border-dark-border rounded-full text-sm">
      <span>{sport.icon}</span>
      <span className="text-gray-300">{sport.name}</span>
    </span>
  )
}
