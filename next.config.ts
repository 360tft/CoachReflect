import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Empty turbopack config to silence Next.js 16 warning about webpack config
  turbopack: {},
  // Exclude Google APIs from bundling (Turbopack compatibility)
  serverExternalPackages: [
    '@googleapis/searchconsole',
    '@googleapis/analyticsdata',
    'google-auth-library',
  ],
  // Security headers for native app webview support
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const needsVercelLive = isDev;

    const cspDirectives = [
      "default-src 'self' capacitor://localhost http://localhost",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com" + (needsVercelLive ? " 'unsafe-eval' https://vercel.live" : ''),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://*.google-analytics.com https://www.googletagmanager.com" + (needsVercelLive ? " https://vercel.com https://vercel.live https://*.vercel.com" : ''),
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stripe.com https://*.sentry.io https://*.ingest.sentry.io https://*.google-analytics.com https://*.googletagmanager.com capacitor://localhost http://localhost" + (needsVercelLive ? " https://vercel.live wss://vercel.live" : ''),
      "worker-src 'self' blob:",
      "media-src 'self' blob: capacitor://localhost http://localhost",
      needsVercelLive ? "frame-src 'self' https://vercel.live" : "frame-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
    ];
  },
  // Exclude .claude directory from webpack/turbopack watching (for webpack fallback)
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/.claude/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps for better error stack traces
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Source map settings
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
