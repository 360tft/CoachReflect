import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`image-upload:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before uploading another image.", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Check subscription - image upload is Pro only
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single()

    const isSubscribed = profile?.subscription_tier !== "free"

    if (!isSubscribed) {
      return NextResponse.json(
        { error: "Image upload is a Pro feature. Please upgrade to continue." },
        { status: 402 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image format: ${file.type}. Supported: JPEG, PNG, WebP, GIF` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 10MB, got ${Math.round(file.size / 1024 / 1024)}MB` },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${user.id}/${timestamp}.${ext}`

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient
      .storage
      .from("session-plans")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient
      .storage
      .from("session-plans")
      .getPublicUrl(filename)

    // Create attachment record
    const { data: attachment, error: attachmentError } = await adminClient
      .from("message_attachments")
      .insert({
        user_id: user.id,
        attachment_type: "image",
        storage_path: uploadData.path,
        mime_type: file.type,
        file_size_bytes: file.size,
        original_filename: file.name,
        processing_status: "pending",
      })
      .select("id")
      .single()

    if (attachmentError) {
      console.error("Attachment record error:", attachmentError)
      // Clean up uploaded file
      await adminClient.storage.from("session-plans").remove([filename])
      return NextResponse.json(
        { error: `Failed to create attachment record: ${attachmentError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      attachment_id: attachment.id,
      file_url: publicUrl,
    })

  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
