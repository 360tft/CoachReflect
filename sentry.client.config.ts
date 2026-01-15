import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring - sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Capture unhandled promise rejections
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Capture 10% of sessions, 100% of sessions with errors
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session replay - capture 10% normally, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Network errors that users can't control
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // User cancelled
    'AbortError',
    // Twitter in-app browser internal errors
    "Can't find variable: CONFIG",
    "Can't find variable: currentInset",
    /updateGapFiller/,
    /updateFooterPositions/,
    // Service worker errors (progressive enhancement, not critical)
    /sw\.js.*load failed/i,
    /service.?worker/i,
    // Webpack chunk loading errors (network issues, partial loads)
    /Cannot read properties of undefined \(reading 'call'\)/,
    /Loading chunk \d+ failed/,
    /ChunkLoadError/,
    // WebGL errors (Safari/browser compatibility, can't control)
    /null is not an object.*getShaderPrecisionFormat/,
    /WebGL/i,
  ],
})
