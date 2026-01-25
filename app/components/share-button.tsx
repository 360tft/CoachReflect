'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'

interface ShareButtonProps {
  reflectionId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ShareButton({ reflectionId, variant = 'outline', size = 'default' }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection_id: reflectionId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create share link')
      }

      const data = await res.json()
      setShareUrl(data.shareUrl)

      // Try to use native share API on mobile
      if (navigator.share) {
        await navigator.share({
          title: 'My Coaching Reflection',
          text: 'Check out my coaching reflection on Coach Reflection',
          url: data.shareUrl,
        })
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled share, not an error
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to share')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <span className="animate-spin">...</span>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
        {copied ? 'Link Copied!' : 'Share'}
      </Button>

      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-destructive">{error}</p>
      )}

      {shareUrl && !copied && !navigator.share && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-background border rounded-lg shadow-lg z-10 min-w-[200px]">
          <p className="text-xs text-muted-foreground mb-1">Share link:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 text-xs p-1 border rounded bg-muted"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl)
                setCopied(true)
                setTimeout(() => {
                  setCopied(false)
                  setShareUrl(null)
                }, 2000)
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
