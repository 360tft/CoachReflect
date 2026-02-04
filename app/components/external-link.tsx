'use client'

import { useCallback, type ReactNode, type AnchorHTMLAttributes } from 'react'
import { Capacitor } from '@capacitor/core'

interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'onClick'> {
  href: string
  children: ReactNode
}

/**
 * Link component for external URLs.
 * On native platforms (iOS/Android), opens in Capacitor in-app browser.
 * On web, opens in a new tab with target="_blank".
 */
export function ExternalLink({ href, children, rel, ...props }: ExternalLinkProps) {
  const handleClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (Capacitor.isNativePlatform()) {
      e.preventDefault()
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url: href })
      } catch {
        window.open(href, '_blank')
      }
    }
  }, [href])

  return (
    <a
      href={href}
      target="_blank"
      rel={rel || 'noopener noreferrer'}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  )
}
