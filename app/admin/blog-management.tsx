"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  published: boolean
  published_at: string | null
  view_count: number
  word_count: number
  created_at: string
  updated_at: string
}

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  // Form state for new/edit post
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "general",
    published: false,
  })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/blog")
      if (!res.ok) throw new Error("Failed to fetch posts")
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const triggerGeneration = async () => {
    if (!confirm("This will generate blog posts from popular questions. Continue?")) {
      return
    }

    try {
      setGenerating(true)
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
      })
      const data = await res.json()
      alert(`Result: ${data.message || data.error}`)
      fetchPosts()
    } catch (err) {
      alert("Failed to trigger generation: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setGenerating(false)
    }
  }

  const togglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          published: !post.published,
        }),
      })
      if (!res.ok) throw new Error("Failed to update post")
      fetchPosts()
    } catch (err) {
      alert("Failed to update post: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const deletePost = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/blog?id=${post.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete post")
      fetchPosts()
    } catch (err) {
      alert("Failed to delete post: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const method = editingPost ? "PUT" : "POST"
      const body = editingPost
        ? { id: editingPost.id, ...formData }
        : formData

      const res = await fetch("/api/admin/blog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save post")
      }

      setShowForm(false)
      setEditingPost(null)
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: "general",
        published: false,
      })
      fetchPosts()
    } catch (err) {
      alert("Failed to save post: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: "", // Content is not fetched in list view
      category: post.category,
      published: post.published,
    })
    setShowForm(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blog Management</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Blog Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchPosts}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blog Management</CardTitle>
            <CardDescription>
              {posts.length} blog posts - Auto-generated from popular coaching questions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingPost(null)
                setFormData({
                  title: "",
                  slug: "",
                  excerpt: "",
                  content: "",
                  category: "general",
                  published: false,
                })
                setShowForm(!showForm)
              }}
            >
              {showForm ? "Cancel" : "New Post"}
            </Button>
            <Button
              onClick={triggerGeneration}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Posts"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* New/Edit Post Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 bg-muted rounded-lg space-y-4">
            <h3 className="font-semibold">
              {editingPost ? "Edit Post" : "New Blog Post"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  required
                  disabled={!!editingPost}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Excerpt</label>
              <input
                type="text"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background h-40"
                required={!editingPost}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="general">General</option>
                  <option value="session_planning">Session Planning</option>
                  <option value="player_development">Player Development</option>
                  <option value="tactics">Tactics</option>
                  <option value="reflection">Reflection</option>
                  <option value="communication">Communication</option>
                  <option value="match_preparation">Match Preparation</option>
                  <option value="coaching_philosophy">Coaching Philosophy</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Published</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : (editingPost ? "Update Post" : "Create Post")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingPost(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No blog posts yet. Click &quot;Generate Posts&quot; to create posts from popular questions.
          </p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      post.published
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded">
                      {post.category}
                    </span>
                  </div>
                  <h4 className="font-medium truncate">{post.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {post.excerpt}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{post.word_count || 0} words</span>
                    <span>{post.view_count || 0} views</span>
                    <span>Published: {formatDate(post.published_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(post)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublish(post)}
                  >
                    {post.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deletePost(post)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
