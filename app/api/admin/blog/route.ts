import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/admin"
import {
  getAllBlogPosts,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
} from "@/lib/blog"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - List all blog posts (admin only)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const posts = await getAllBlogPosts()

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("[ADMIN_BLOG] Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    )
  }
}

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, excerpt, content, category, topics, published, slug } = body

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: "Title, content, and slug are required" },
        { status: 400 }
      )
    }

    // Clean slug
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    const adminClient = createAdminClient()

    const wordCount = content.split(/\s+/).length

    const { data, error } = await adminClient
      .from("blog_posts")
      .insert({
        title,
        excerpt: excerpt || title,
        content,
        category: category || "general",
        topics: topics || [],
        published: published || false,
        published_at: published ? new Date().toISOString() : null,
        slug: cleanSlug,
        seo_title: title,
        seo_description: excerpt || title,
        word_count: wordCount,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_BLOG] Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    )
  }
}

// PUT - Update a blog post
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      )
    }

    // Verify post exists
    const existingPost = await getBlogPostById(id)
    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    const updatedPost = await updateBlogPost(id, updates)

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error("[ADMIN_BLOG] Error updating post:", error)
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a blog post
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      )
    }

    await deleteBlogPost(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_BLOG] Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    )
  }
}
