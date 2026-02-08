'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'

export function ShareSummary() {
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/api/share/summary`

  const handleShare = async () => {
    setSharing(true)

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Coaching Week - Coach Reflection',
          text: 'Check out my coaching reflection summary this week!',
          url: 'https://coachreflection.com',
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText('https://coachreflection.com')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard failed
      }
    }

    setSharing(false)
  }

  const handleDownloadImage = async () => {
    setSharing(true)
    try {
      const res = await fetch(shareUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'coaching-week-summary.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Download failed
    }
    setSharing(false)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={sharing}
        className="gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? 'Link copied!' : 'Share my week'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadImage}
        disabled={sharing}
        className="gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download card
      </Button>
    </div>
  )
}
