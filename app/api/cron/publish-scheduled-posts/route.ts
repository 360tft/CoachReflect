import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Vercel cron job - runs daily at 06:00 UTC to publish scheduled blog posts
// Configure in vercel.json with: { "crons": [{ "path": "/api/cron/publish-scheduled-posts", "schedule": "0 6 * * *" }] }

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  try {
    const { data: posts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, title, slug")
      .eq("published", false)
      .not("scheduled_publish_at", "is", null)
      .lte("scheduled_publish_at", new Date().toISOString())

    if (fetchError) {
      throw fetchError
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: "No posts scheduled for publishing",
        published: 0,
      })
    }

    const postIds = posts.map((p) => p.id)

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        published: true,
        published_at: new Date().toISOString(),
      })
      .in("id", postIds)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      message: `Published ${posts.length} scheduled post(s)`,
      published: posts.length,
      posts: posts.map((p) => ({ title: p.title, slug: p.slug })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to publish scheduled posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
