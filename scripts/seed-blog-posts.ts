import { createClient } from "@supabase/supabase-js"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

/**
 * Seed blog posts from /content/blog-posts/ into the database.
 *
 * Usage: npx tsx scripts/seed-blog-posts.ts
 *
 * Posts are inserted as unpublished with staggered scheduled_publish_at dates
 * (one per week starting from next Monday at 06:00 UTC).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface PostFrontmatter {
  title: string
  slug: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  category: string
  topics: string[]
  scheduledWeek: number
}

function parseFrontmatter(content: string): { frontmatter: PostFrontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error("No frontmatter found")
  }

  const raw = match[1]
  const body = match[2].trim()

  const fm: Record<string, unknown> = {}
  for (const line of raw.split("\n")) {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    let value: unknown = line.slice(colonIndex + 1).trim()

    // Remove surrounding quotes
    if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }

    // Parse arrays
    if (typeof value === "string" && value.startsWith("[")) {
      try {
        value = JSON.parse(value)
      } catch {
        // Keep as string if parse fails
      }
    }

    // Parse numbers
    if (typeof value === "string" && /^\d+$/.test(value)) {
      value = parseInt(value, 10)
    }

    fm[key] = value
  }

  return { frontmatter: fm as unknown as PostFrontmatter, body }
}

function getNextMonday(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + daysUntilMonday)
  monday.setUTCHours(6, 0, 0, 0)
  return monday
}

async function main() {
  const contentDir = join(process.cwd(), "content", "blog-posts")
  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md")).sort()

  if (files.length === 0) {
    console.log("No blog post files found in content/blog-posts/")
    return
  }

  console.log(`Found ${files.length} blog post files`)

  const startDate = getNextMonday()
  let inserted = 0
  let skipped = 0

  for (const file of files) {
    const raw = readFileSync(join(contentDir, file), "utf-8")
    const { frontmatter, body } = parseFrontmatter(raw)

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", frontmatter.slug)
      .single()

    if (existing) {
      console.log(`  Skipping "${frontmatter.title}" (slug already exists)`)
      skipped++
      continue
    }

    // Calculate scheduled date based on scheduledWeek
    const scheduledDate = new Date(startDate)
    scheduledDate.setUTCDate(startDate.getUTCDate() + (frontmatter.scheduledWeek - 1) * 7)

    const wordCount = body.split(/\s+/).length

    const { error } = await supabase.from("blog_posts").insert({
      slug: frontmatter.slug,
      title: frontmatter.title,
      excerpt: frontmatter.excerpt,
      content: body,
      category: frontmatter.category,
      topics: frontmatter.topics,
      published: false,
      seo_title: frontmatter.seoTitle,
      seo_description: frontmatter.seoDescription,
      word_count: wordCount,
      scheduled_publish_at: scheduledDate.toISOString(),
    })

    if (error) {
      console.error(`  Error inserting "${frontmatter.title}":`, error.message)
    } else {
      console.log(`  Inserted "${frontmatter.title}" (scheduled: ${scheduledDate.toISOString().split("T")[0]})`)
      inserted++
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
