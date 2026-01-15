import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence Next.js 16 warning about webpack config
  turbopack: {},
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
