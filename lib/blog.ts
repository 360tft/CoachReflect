import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@supabase/supabase-js"

// Safe admin client that won't throw during build
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

interface QuestionData {
  question_group: string
  category: string
  topics: string[] | null
  total_asks: number
  sample_question: string
}

interface GeneratedBlogPost {
  title: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
  slug: string
}

const BLOG_SYSTEM_PROMPT = `You are a sports coaching expert writing SEO-optimized blog posts for Coach Reflection, an AI-powered reflection tool for coaches across all sports.

Write in-depth, helpful content that:
- Answers the question thoroughly (1500-2500 words)
- Uses H2 (##) and H3 (###) headers for clear structure
- Includes practical tips and actionable advice for coaches
- Uses a friendly, knowledgeable, and supportive tone (like a fellow coach sharing insights)
- Includes a "Key Takeaways" section near the top
- Addresses common follow-up questions coaches might have
- Ends with a call-to-action to use Coach Reflection for tracking coaching reflections

Writing style guidelines:
- Write in second person ("you") to engage coaches
- Use short paragraphs (2-4 sentences max)
- Include bullet points and numbered lists where appropriate
- Avoid generic fluff - be specific and helpful with coaching examples
- Don't repeat the same information
- Include real-world coaching scenarios when possible
- Use language like "I've found...", "In my experience...", "Something I've noticed..."

SEO guidelines:
- Title should be 50-60 characters, compelling, and include primary keyword
- Excerpt should be 150-160 characters with clear value proposition
- Use the primary keyword naturally 3-5 times throughout the content
- Include related coaching keywords and synonyms

IMPORTANT: Return your response as valid JSON with this exact structure:
{
  "title": "Engaging, SEO-optimized title (50-60 chars)",
  "excerpt": "Compelling meta description (150-160 chars)",
  "content": "Full markdown content with ## and ### headers",
  "seoTitle": "Full title for SEO (can be longer)",
  "seoDescription": "Full meta description for SEO",
  "slug": "url-friendly-slug-with-dashes"
}

Do not include any text before or after the JSON. Only output the JSON object.`

/**
 * Generate a blog post from a question using Gemini AI
 */
export async function generateBlogPost(question: QuestionData): Promise<GeneratedBlogPost> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

  const topicContext = question.topics?.length
    ? `Related topics: ${question.topics.join(", ")}`
    : "General coaching topic"

  const prompt = `Write a comprehensive blog post answering this popular coaching question:

"${question.sample_question}"

Context:
- Category: ${question.category}
- ${topicContext}
- This question has been asked ${question.total_asks} times by coaches

The blog post should thoroughly answer this question and related follow-up questions that coaches might have.`

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: BLOG_SYSTEM_PROMPT,
    })

    const result = await model.generateContent(prompt)
    const response = result.response
    const responseText = response.text()

    if (!responseText) {
      throw new Error("No text content in response")
    }

    // Parse the JSON response
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedBlogPost

    // Validate required fields
    if (!parsed.title || !parsed.excerpt || !parsed.content || !parsed.slug) {
      throw new Error("Missing required fields in generated content")
    }

    // Clean up the slug
    parsed.slug = parsed.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    return parsed
  } catch (error) {
    console.error("[BLOG] Error generating blog post:", error)
    throw error
  }
}

/**
 * Save a generated blog post to the database
 */
export async function saveBlogPost(
  post: GeneratedBlogPost,
  question: QuestionData
): Promise<string> {
  const supabase = getAdminClient()
  if (!supabase) {
    throw new Error("Database not configured")
  }

  // Calculate word count
  const wordCount = post.content.split(/\s+/).length

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: question.category,
      question_group: question.question_group,
      topics: question.topics || [],
      published: true,
      published_at: new Date().toISOString(),
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
      word_count: wordCount,
    })
    .select("id")
    .single()

  if (error) {
    // If slug already exists, append a timestamp
    if (error.code === "23505") {
      const uniqueSlug = `${post.slug}-${Date.now().toString(36)}`
      const { data: retryData, error: retryError } = await supabase
        .from("blog_posts")
        .insert({
          slug: uniqueSlug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: question.category,
          question_group: question.question_group,
          topics: question.topics || [],
          published: true,
          published_at: new Date().toISOString(),
          seo_title: post.seoTitle,
          seo_description: post.seoDescription,
          word_count: wordCount,
        })
        .select("id")
        .single()

      if (retryError) {
        throw retryError
      }
      return retryData.id
    }
    throw error
  }

  return data.id
}

/**
 * Get all published blog posts
 */
export async function getPublishedBlogPosts() {
  const supabase = getAdminClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })

  if (error) {
    console.error("[BLOG] Error fetching posts:", error)
    return []
  }

  return data || []
}

/**
 * Get a blog post by slug
 */
export async function getBlogPostBySlug(slug: string) {
  const supabase = getAdminClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Not found
    }
    console.error("[BLOG] Error fetching post:", error)
    return null
  }

  return data
}

/**
 * Get a blog post by ID (for admin)
 */
export async function getBlogPostById(id: string) {
  const supabase = getAdminClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[BLOG] Error fetching post by ID:", error)
    return null
  }

  return data
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
  id: string,
  updates: Partial<{
    title: string
    excerpt: string
    content: string
    category: string
    topics: string[]
    published: boolean
    seo_title: string
    seo_description: string
  }>
) {
  const supabase = getAdminClient()
  if (!supabase) {
    throw new Error("Database not configured")
  }

  // Build update object
  const updateData: Record<string, unknown> = { ...updates }

  // Calculate word count if content is updated
  if (updates.content) {
    updateData.word_count = updates.content.split(/\s+/).length
  }

  // Handle published_at based on published state
  if (updates.published !== undefined) {
    if (updates.published) {
      updateData.published_at = new Date().toISOString()
    } else {
      updateData.published_at = null
    }
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[BLOG] Error updating post:", error)
    throw error
  }

  return data
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string) {
  const supabase = getAdminClient()
  if (!supabase) {
    throw new Error("Database not configured")
  }

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[BLOG] Error deleting post:", error)
    throw error
  }

  return true
}

/**
 * Increment view count for a blog post
 */
export async function incrementBlogPostViews(slug: string) {
  const supabase = getAdminClient()
  if (!supabase) {
    return
  }
  await supabase.rpc("increment_blog_view", { post_slug: slug })
}

/**
 * Get related blog posts
 */
export async function getRelatedBlogPosts(
  currentSlug: string,
  category: string,
  limit: number = 3
) {
  const supabase = getAdminClient()
  if (!supabase) {
    return []
  }

  // First try to find posts in the same category
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, category, published_at")
    .eq("published", true)
    .neq("slug", currentSlug)
    .eq("category", category)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[BLOG] Error fetching related posts:", error)
    return []
  }

  // If not enough, fill with any other posts
  if (data.length < limit) {
    const { data: moreData } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, category, published_at")
      .eq("published", true)
      .neq("slug", currentSlug)
      .neq("category", category)
      .order("published_at", { ascending: false })
      .limit(limit - data.length)

    if (moreData) {
      data.push(...moreData)
    }
  }

  return data
}

/**
 * Get top questions for blog generation
 */
export async function getTopQuestionsForBlog(days: number = 7, limit: number = 10) {
  const supabase = getAdminClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase.rpc("get_top_questions_for_blog", {
    p_days: days,
    p_limit: limit,
  })

  if (error) {
    console.error("[BLOG] Error fetching top questions:", error)
    return []
  }

  return data as QuestionData[]
}

/**
 * Get all blog posts (for admin, including unpublished)
 */
export async function getAllBlogPosts() {
  const supabase = getAdminClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[BLOG] Error fetching all posts:", error)
    return []
  }

  return data || []
}
