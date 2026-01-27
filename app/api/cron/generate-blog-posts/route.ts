import { NextResponse } from "next/server"
import { getTopQuestionsForBlog, generateBlogPost, saveBlogPost } from "@/lib/blog"

// Vercel cron job - runs weekly (Monday 12:00 UTC) to generate blog posts from popular questions
// Configure in vercel.json with: { "crons": [{ "path": "/api/cron/generate-blog-posts", "schedule": "0 12 * * 1" }] }

export const maxDuration = 300 // 5 minutes max for blog generation

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Skip if no Google AI API key configured
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ message: "AI not configured" }, { status: 200 })
  }

  const results = {
    questionsFound: 0,
    postsGenerated: 0,
    errors: [] as string[],
  }

  try {
    // Get top 5 questions from the last 7 days that don't have blog posts yet
    const topQuestions = await getTopQuestionsForBlog(7, 5)

    if (!topQuestions || topQuestions.length === 0) {
      return NextResponse.json({
        message: "No new questions found",
        results,
      }, { status: 200 })
    }

    results.questionsFound = topQuestions.length

    // Generate blog posts for each question
    for (const question of topQuestions) {
      try {
        // Generate the blog post content
        const blogPost = await generateBlogPost(question)

        // Save to database
        const postId = await saveBlogPost(blogPost, question)

        results.postsGenerated++

        // Add a small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        console.error(`[BLOG_CRON] Error generating post for "${question.sample_question}":`, errorMsg)
        results.errors.push(`${question.question_group}: ${errorMsg}`)
      }
    }

    return NextResponse.json({
      message: `Generated ${results.postsGenerated} blog posts`,
      results,
    }, { status: 200 })

  } catch (error) {
    console.error("[BLOG_CRON] Fatal error:", error)
    return NextResponse.json({
      error: "Blog generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
      results,
    }, { status: 500 })
  }
}

// Also support POST for manual triggering from admin
export async function POST(request: Request) {
  return GET(request)
}
