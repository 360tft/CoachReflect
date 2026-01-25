import { Metadata } from "next"
import Link from "next/link"
import { getPublishedBlogPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Coaching Blog - Tips, Insights & Advice",
  description: "Expert coaching advice and answers to the most popular coaching questions. Tips on session planning, player development, tactics, and more.",
  keywords: ["football coaching blog", "coaching tips", "coaching advice", "session planning", "player development"],
  openGraph: {
    title: "Coaching Blog - Expert Tips & Guides | Coach Reflection",
    description: "Expert coaching advice and answers to the most popular coaching questions.",
  },
}

export const revalidate = 3600 // Revalidate every hour

// Category display config
const categoryConfig: Record<string, { label: string; color: string }> = {
  session_planning: { label: "Session Planning", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  player_development: { label: "Player Development", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  tactics: { label: "Tactics", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  reflection: { label: "Reflection", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
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

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  published_at: string
  word_count: number
  topics: string[]
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const categoryInfo = categoryConfig[post.category] || categoryConfig.general
  const readTime = Math.ceil((post.word_count || 1500) / 200) // Avg 200 words per minute

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-card rounded-lg hover:shadow-md transition-shadow duration-200 border border-border"
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {readTime} min read
          </span>
        </div>

        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {post.title}
        </h3>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatDate(post.published_at)}
          </span>
          <span className="text-primary font-medium group-hover:underline">
            Read more
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts() as BlogPost[]

  // Group posts by category
  const postsByCategory = posts.reduce((acc, post) => {
    const category = post.category || "general"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(post)
    return acc
  }, {} as Record<string, BlogPost[]>)

  // Get featured posts (most recent 3)
  const featuredPosts = posts.slice(0, 3)
  const remainingPosts = posts.slice(3)

  return (
    <div className="min-h-screen bg-background">
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

      {/* Page Header */}
      <div className="bg-secondary py-12">
        <div className="container mx-auto px-4">
          <nav className="mb-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-primary">Home</Link>
            <span className="text-muted-foreground mx-2">/</span>
            <span className="text-foreground">Blog</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3 text-foreground">
            Coaching Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Expert answers to the most popular coaching questions. Tips, guides, and insights to help you become a better coach.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              No blog posts yet. Check back soon!
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              Start Reflecting
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="flex flex-wrap gap-6 mb-10 text-sm text-muted-foreground">
              <span>{posts.length} articles</span>
              <span>-</span>
              <span>{Object.keys(postsByCategory).length} categories</span>
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Latest Posts
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPosts.map(post => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* All Posts */}
            {remainingPosts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  All Articles
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {remainingPosts.map(post => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* CTA Section */}
            <section className="bg-secondary rounded-lg p-8 mt-8">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Ready to improve your coaching?
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Start reflecting on your sessions with AI-powered insights.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/signup"
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors text-sm"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-2.5 bg-card text-foreground border border-border rounded font-medium hover:bg-accent transition-colors text-sm"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
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
              <Link href="/" className="hover:text-primary">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
