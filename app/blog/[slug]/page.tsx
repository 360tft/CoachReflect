import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getBlogPostBySlug, getPublishedBlogPosts, getRelatedBlogPosts, incrementBlogPostViews } from "@/lib/blog"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  try {
    const posts = await getPublishedBlogPosts()
    return posts.map((post: { slug: string }) => ({ slug: post.slug }))
  } catch {
    // During build, env vars may not be available
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    },
  }
}

// Category display config
const categoryConfig: Record<string, { label: string; color: string }> = {
  session_planning: { label: "Session Planning", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  player_development: { label: "Player Development", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  tactics: { label: "Tactics", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  reflection: { label: "Reflection", color: "bg-primary/10 text-primary dark:bg-primary/10/30 dark:text-amber-300" },
  communication: { label: "Communication", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  match_preparation: { label: "Match Prep", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  coaching_philosophy: { label: "Philosophy", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
  general: { label: "General", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Simple markdown renderer for blog content
function renderMarkdown(content: string): string {
  const html = content
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-foreground mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-foreground mt-10 mb-4">$1</h2>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-muted-foreground">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-muted-foreground list-decimal">$1</li>')
    // Paragraphs (lines with text that aren't headers or lists)
    .replace(/^(?!<[hl]|<li)(.+)$/gm, '<p class="text-muted-foreground mb-4 leading-relaxed">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p class="[^"]*"><\/p>/g, "")
    // Wrap consecutive list items in ul/ol
    .replace(/(<li class="ml-4 text-muted-foreground">.*?<\/li>\n?)+/g, (match) => {
      return `<ul class="list-disc mb-4 space-y-1">${match}</ul>`
    })
    .replace(/(<li class="ml-4 text-muted-foreground list-decimal">.*?<\/li>\n?)+/g, (match) => {
      return `<ol class="list-decimal mb-4 space-y-1">${match}</ol>`
    })

  return html
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Increment view count (fire and forget)
  incrementBlogPostViews(slug).catch(() => {})

  // Get related posts
  const relatedPosts = await getRelatedBlogPosts(slug, post.category, 3)

  const categoryInfo = categoryConfig[post.category] || categoryConfig.general
  const readTime = Math.ceil((post.word_count || 1500) / 200)
  const renderedContent = renderMarkdown(post.content)

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: {
              "@type": "Organization",
              name: "Coach Reflection",
            },
            publisher: {
              "@type": "Organization",
              name: "Coach Reflection",
              logo: {
                "@type": "ImageObject",
                url: "https://coachreflection.com/logo.png",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://coachreflection.com/blog/${slug}`,
            },
          }),
        }}
      />

      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CR</span>
            </div>
            <span className="font-semibold text-foreground">Coach Reflection</span>
          </Link>
        </div>
      </header>

      {/* Article Header */}
      <div className="bg-secondary py-10">
        <div className="container mx-auto px-4">
          <nav className="mb-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-primary">Home</Link>
            <span className="text-muted-foreground mx-2">/</span>
            <Link href="/blog" className="text-muted-foreground hover:text-primary">Blog</Link>
            <span className="text-muted-foreground mx-2">/</span>
            <span className="text-foreground">{post.title}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-2.5 py-1 rounded text-xs font-medium ${categoryInfo.color}`}>
                {categoryInfo.label}
              </span>
              <span className="text-muted-foreground text-sm">
                {readTime} min read
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">
              {post.title}
            </h1>
            <p className="text-muted-foreground">
              {post.excerpt}
            </p>

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>Published {formatDate(post.published_at)}</span>
              {post.view_count > 0 && (
                <>
                  <span>-</span>
                  <span>{post.view_count.toLocaleString()} views</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Article Content */}
          <article className="lg:col-span-2">
            <div
              className="prose prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />

            {/* Tags */}
            {post.topics?.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Related Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.topics.map((topic: string) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-secondary text-muted-foreground rounded text-sm"
                    >
                      {topic.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 bg-secondary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ready to improve your coaching?
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Start reflecting on your sessions and track your growth as a coach.
              </p>
              <Link
                href="/signup"
                className="inline-block px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="font-semibold text-foreground mb-4">
                  Related Articles
                </h3>
                <div className="space-y-4">
                  {relatedPosts.map((related: { slug: string; title: string; excerpt: string; category: string }) => (
                    <Link
                      key={related.slug}
                      href={`/blog/${related.slug}`}
                      className="block group"
                    >
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm line-clamp-2">
                        {related.title}
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {related.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Try Coach Reflection CTA */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-semibold text-foreground mb-2">
                Track Your Growth
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                AI-powered reflections help you become a better coach.
              </p>
              <Link
                href="/signup"
                className="block w-full text-center py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Try Coach Reflection Free
              </Link>
            </div>

            {/* Browse More */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">
                Browse More
              </h3>
              <div className="space-y-2">
                <Link
                  href="/blog"
                  className="block text-sm text-primary hover:underline"
                >
                  All Blog Posts
                </Link>
                <Link
                  href="/"
                  className="block text-sm text-muted-foreground hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  className="block text-sm text-muted-foreground hover:text-primary"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Coach Reflection by 360TFT
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary">Privacy</Link>
              <Link href="/terms" className="hover:text-primary">Terms</Link>
              <Link href="/blog" className="hover:text-primary">Blog</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
