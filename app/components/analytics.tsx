'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const GA_ID = process.env.NEXT_PUBLIC_GA4_ID

  // Track page views on route change
  useEffect(() => {
    if (!GA_ID || !pathname) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Send pageview with custom URL
    if (window.gtag) {
      window.gtag('config', GA_ID, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, GA_ID])

  return null
}

export function Analytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA4_ID

  // Don't render if no GA_ID is configured
  if (!GA_ID) {
    return null
  }

  return (
    <>
      {/* Google Analytics gtag.js script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
