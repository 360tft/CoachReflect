import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasSyllabusFeature } from "@/lib/subscription"
import { nanoid } from "nanoid"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
]

function getFileType(mimeType: string): 'pdf' | 'image' | 'audio' | 'document' {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

/**
 * POST /api/syllabus/upload - Upload a new syllabus
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    const adminClient = createAdminClient()

    // Check if user is a club member
    const { data: membership } = await adminClient
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isClubMember = !!membership?.club_id

    // Check if user can use syllabus feature
    if (!hasSyllabusFeature(profile?.subscription_tier || 'free', isClubMember)) {
      return NextResponse.json(
        { error: "Syllabus feature requires Pro+ subscription" },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const baseType = file.type.split(';')[0].trim()
    if (!ALLOWED_TYPES.includes(baseType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, images, audio files" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB" },
        { status: 400 }
      )
    }

    // Delete existing personal syllabus if any
    const { data: existingSyllabus } = await adminClient
      .from('syllabi')
      .select('id, file_url')
      .eq('user_id', user.id)
      .is('club_id', null)
      .single()

    if (existingSyllabus) {
      // Delete old file from storage
      const oldPath = `${user.id}/${existingSyllabus.file_url?.split('/').pop()}`
      await adminClient.storage.from('syllabi').remove([oldPath])

      // Delete old record
      await adminClient.from('syllabi').delete().eq('id', existingSyllabus.id)
    }

    // Generate unique storage path
    const fileExt = file.name.split('.').pop() || 'pdf'
    const storagePath = `${user.id}/${nanoid()}.${fileExt}`

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient
      .storage
      .from('syllabi')
      .upload(storagePath, buffer, {
        contentType: baseType,
        upsert: false,
      })

    if (uploadError) {
      console.error("Syllabus upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient
      .storage
      .from('syllabi')
      .getPublicUrl(storagePath)

    // Create syllabus record
    const { data: syllabus, error: insertError } = await adminClient
      .from('syllabi')
      .insert({
        user_id: user.id,
        club_id: null, // Personal syllabus
        title: title || 'My Coaching Syllabus',
        file_url: publicUrl,
        file_type: getFileType(baseType),
        original_filename: file.name,
        file_size_bytes: file.size,
        processing_status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      // Clean up uploaded file
      await adminClient.storage.from('syllabi').remove([storagePath])
      console.error("Syllabus insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to save syllabus" },
        { status: 500 }
      )
    }

    // TODO: Queue processing for text extraction (PDF/images) or transcription (audio)
    // For now, mark as completed without processing
    await adminClient
      .from('syllabi')
      .update({ processing_status: 'completed' })
      .eq('id', syllabus.id)

    return NextResponse.json({
      success: true,
      syllabus: {
        ...syllabus,
        processing_status: 'completed',
      },
    })

  } catch (error) {
    console.error("Syllabus upload error:", error)
    return NextResponse.json({ error: "Failed to upload syllabus" }, { status: 500 })
  }
}
