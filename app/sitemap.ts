import { MetadataRoute } from 'next'
import { getPublishedBlogPosts } from '@/lib/blog'
import { getAllTopicSlugs } from '@/lib/topics'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://coachreflection.com'
  const lastModified = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/referral`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ai-coaching-journal`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/soccer-reflection`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/football-reflection`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cpd-coaching-log`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/coaching-reflection-cricket`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/coaching-reflection-basketball`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/coaching-reflection-tennis`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Blog posts
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const blogPosts = await getPublishedBlogPosts()
    blogPages = blogPosts.map((post: { slug: string; updated_at: string; published_at: string }) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
  }

  // Topic pages (programmatic SEO)
  const topicUrls: MetadataRoute.Sitemap = getAllTopicSlugs().map(slug => ({
    url: `${baseUrl}/topics/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const topicsHubUrl: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // Note: Public share pages (/share/[id]) are intentionally excluded
  // These are user-generated reflection pages that should not be indexed
  // until we implement proper metadata and social sharing features

  return [...staticPages, ...topicsHubUrl, ...topicUrls, ...blogPages]
}
