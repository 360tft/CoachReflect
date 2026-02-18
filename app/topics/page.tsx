import { Metadata } from "next"
import Link from "next/link"
import { COACHING_TOPICS, type CoachingTopic } from "@/lib/topics"

export const metadata: Metadata = {
  title: "Coaching Reflection Topics | CoachReflection",
  description: "Explore coaching reflection topics. Post-session reflection, player development, communication, and more. Guided questions for every coaching scenario.",
  openGraph: {
    title: "Coaching Reflection Topics",
    description: "Explore coaching reflection topics. Guided questions for every scenario.",
  },
}

const categoryLabels: Record<CoachingTopic['category'], { label: string; color: string }> = {
  reflection: { label: "Reflection", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  development: { label: "Development", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  communication: { label: "Communication", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  planning: { label: "Planning", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  wellbeing: { label: "Wellbeing", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
}

export default function TopicsPage() {
  const categories = ['reflection', 'development', 'planning', 'communication', 'wellbeing'] as const

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CR</span>
            </div>
            <span className="font-semibold text-foreground">CoachReflection</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Coaching Reflection Topics</h1>
        <p className="text-muted-foreground mb-10 text-lg">
          Guided reflection questions for every coaching scenario. Pick a topic and start reflecting.
        </p>

        {categories.map(category => {
          const topics = COACHING_TOPICS.filter(t => t.category === category)
          const catInfo = categoryLabels[category]
          return (
            <section key={category} className="mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${catInfo.color}`}>
                  {catInfo.label}
                </span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {topics.map(topic => (
                  <Link
                    key={topic.slug}
                    href={`/topics/${topic.slug}`}
                    className="block p-5 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group"
                  >
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {topic.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {topic.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {topic.questions.length} reflection questions
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        <div className="mt-12 bg-card border border-border rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Ready to start reflecting?</h2>
          <p className="text-muted-foreground text-sm mb-4">
            CoachReflection uses AI to help you capture and learn from every session.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">CoachReflection by 360TFT</span>
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
