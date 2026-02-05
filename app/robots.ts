import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://coachreflection.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/',
          '/api/',
          '/auth/',
          '/admin/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/about', '/blog'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/about', '/blog'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/about', '/blog'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/about', '/blog'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
