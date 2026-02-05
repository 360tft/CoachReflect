import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { COACHING_TOPICS, getTopicBySlug, getAllTopicSlugs } from "@/lib/topics"

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllTopicSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopicBySlug(slug)

  if (!topic) {
    return { title: "Topic Not Found" }
  }

  return {
    title: `${topic.title} | Coach Reflection`,
    description: topic.description,
    openGraph: {
      title: `${topic.title} - Coaching Reflection Guide`,
      description: topic.description,
    },
  }
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)

  if (!topic) {
    notFound()
  }

  const relatedTopics = topic.relatedTopics
    .map(s => COACHING_TOPICS.find(t => t.slug === s))
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: topic.questions.map(q => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Use Coach Reflection to explore this question through guided AI-powered reflection. ${topic.description}`,
              },
            })),
          }),
        }}
      />

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

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-primary">Home</Link>
          <span className="text-muted-foreground mx-2">/</span>
          <Link href="/topics" className="text-muted-foreground hover:text-primary">Topics</Link>
          <span className="text-muted-foreground mx-2">/</span>
          <span className="text-foreground">{topic.title}</span>
        </nav>

        <h1 className="text-3xl font-bold text-foreground mb-3">{topic.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{topic.description}</p>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Reflection Questions</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Use these questions as starting points for your coaching reflection.
          </p>
          <div className="space-y-3">
            {topic.questions.map((question, i) => (
              <div key={i} className="p-4 bg-card border border-border rounded-lg">
                <p className="text-foreground font-medium">{question}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 bg-primary/5 border border-primary/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Reflect with AI</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Coach Reflection uses AI to guide your thinking, spot patterns across sessions, and help you grow as a coach.
          </p>
          <Link
            href="/signup"
            className="inline-block px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Start Reflecting Free
          </Link>
        </section>

        {relatedTopics.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Related Topics</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedTopics.map(related => related && (
                <Link
                  key={related.slug}
                  href={`/topics/${related.slug}`}
                  className="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-medium text-foreground text-sm">{related.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{related.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">Coach Reflection by 360TFT</span>
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
