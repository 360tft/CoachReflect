import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/admin"
import { getTopQuestionsForBlog, generateBlogPost, saveBlogPost } from "@/lib/blog"

export const maxDuration = 300

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ message: "AI not configured" }, { status: 200 })
    }

    const results = {
      questionsFound: 0,
      postsGenerated: 0,
      errors: [] as string[],
    }

    const topQuestions = await getTopQuestionsForBlog(7, 5)

    if (!topQuestions || topQuestions.length === 0) {
      return NextResponse.json({
        message: "No new questions found",
        results,
      })
    }

    results.questionsFound = topQuestions.length

    for (const question of topQuestions) {
      try {
        const blogPost = await generateBlogPost(question)
        await saveBlogPost(blogPost, question)
        results.postsGenerated++
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${question.question_group}: ${errorMsg}`)
      }
    }

    return NextResponse.json({
      message: `Generated ${results.postsGenerated} blog posts`,
      results,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Blog generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
