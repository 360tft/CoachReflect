'use client'

import { useState, useEffect } from 'react'

interface Activity {
  id: string
  type: 'upgrade' | 'streak' | 'online'
  message: string
}

// Realistic activity data (anonymous)
const activities: Activity[] = [
  { id: '1', type: 'upgrade', message: 'James from Manchester just upgraded to Pro' },
  { id: '2', type: 'upgrade', message: 'Sophie from London just upgraded to Pro' },
  { id: '3', type: 'streak', message: 'David completed their 7-day reflection streak!' },
  { id: '4', type: 'online', message: '18 coaches are reflecting right now' },
  { id: '5', type: 'upgrade', message: 'Maria from Madrid just upgraded to Pro' },
  { id: '6', type: 'streak', message: 'Tom reached a 14-day streak!' },
  { id: '7', type: 'online', message: '25 coaches are reflecting right now' },
  { id: '8', type: 'upgrade', message: 'Alex from Sydney just upgraded to Pro' },
]

export default function SocialProofToast() {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [activityIndex, setActivityIndex] = useState(0)

  useEffect(() => {
    // Show first toast after 30 seconds
    const initialTimeout = setTimeout(() => {
      setCurrentActivity(activities[0])
      setActivityIndex(1)
    }, 30000)

    return () => clearTimeout(initialTimeout)
  }, [])

  useEffect(() => {
    if (currentActivity) {
      // Hide after 5 seconds
      const hideTimeout = setTimeout(() => {
        setCurrentActivity(null)
      }, 5000)

      return () => clearTimeout(hideTimeout)
    } else if (activityIndex > 0) {
      // Show next toast after 45-60 seconds
      const showTimeout = setTimeout(
        () => {
          const nextIndex = activityIndex % activities.length
          setCurrentActivity(activities[nextIndex])
          setActivityIndex(nextIndex + 1)
        },
        Math.random() * 15000 + 45000
      )

      return () => clearTimeout(showTimeout)
    }
  }, [currentActivity, activityIndex])

  if (!currentActivity) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-card border-border rounded-lg shadow-2xl border p-4 flex items-start gap-3">
        {/* Icon based on activity type */}
        <div className="flex-shrink-0">
          {currentActivity.type === 'upgrade' && (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
          {currentActivity.type === 'streak' && (
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
          )}
          {currentActivity.type === 'online' && (
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {currentActivity.message}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Just now
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={() => setCurrentActivity(null)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
