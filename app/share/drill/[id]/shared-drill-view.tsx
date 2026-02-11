'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { DrillSchema } from '@/lib/drill-schema'

const DrillAnimation = dynamic(
  () => import('@/app/components/drill-animation').then(mod => mod.DrillAnimation),
  {
    ssr: false,
    loading: () => <div className="w-full h-[500px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />,
  }
)

interface SharedDrill {
  id: string
  share_id: string
  name: string
  description: string | null
  category: string
  age_group: string | null
  type: string
  set_piece_type: string | null
  drill_data: DrillSchema
  view_count: number
  created_at: string
}

export function SharedDrillView({ drill }: { drill: SharedDrill }) {
  const [copied, setCopied] = useState(false)

  const categoryColors: Record<string, string> = {
    technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    tactical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    physical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    psychological: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'small-sided-game': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'set-piece': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleSocialShare = (platform: 'twitter' | 'whatsapp') => {
    const text = `Check out this drill: ${drill.name}\n\nCreated with Coach Reflection`
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + '\n' + shareUrl)}`,
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Coach Reflection" className="h-7 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="Coach Reflection" className="h-7 w-auto hidden dark:block" />
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-[#E5A11C] text-white text-sm font-medium rounded-lg hover:bg-[#d4940f] transition-colors"
          >
            Try Coach Reflection
          </Link>
        </div>
      </header>

      <main className="mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{drill.name}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${categoryColors[drill.category] || categoryColors.technical}`}>
              {drill.category}
            </span>
            {drill.age_group && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {drill.age_group}
              </span>
            )}
            {drill.type === 'set-piece' && drill.set_piece_type && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {drill.set_piece_type}
              </span>
            )}
          </div>

          {drill.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">{drill.description}</p>
          )}

          <div className="flex justify-center mb-6">
            <DrillAnimation
              drill={drill.drill_data}
              width={700}
              height={700}
              showControls={true}
              autoPlay={false}
            />
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <button
              onClick={() => handleSocialShare('twitter')}
              className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </button>

            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Created with Coach Reflection - AI coaching journal
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E5A11C] text-white font-medium rounded-lg hover:bg-[#d4940f] transition-colors"
            >
              Try Coach Reflection Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
