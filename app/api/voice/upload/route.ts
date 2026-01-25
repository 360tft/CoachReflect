import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateAudioFile } from "@/lib/whisper"
import { nanoid } from "nanoid"
import type { VoiceUploadResponse } from "@/app/types"

const MAX_FILE_SIZE = 50 * 1024 * 1024  // 50MB

// Type for the RPC function response
interface VoiceLimitCheck {
  allowed: boolean
  current_count: number
  limit_count: number
  is_pro: boolean
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 2. Check voice note limit
    const adminClient = createAdminClient()
    let limitCheck: VoiceLimitCheck | null = null

    const { data: limitData, error: limitError } = await adminClient
      .rpc('check_voice_note_limit', { p_user_id: user.id })
      .single()

    if (limitError) {
      console.error('Voice limit check error:', limitError)
      // If the function doesn't exist yet, allow (for development)
      if (!limitError.message.includes('function') && !limitError.message.includes('does not exist')) {
        return NextResponse.json(
          { error: "Failed to check voice note limit" },
          { status: 500 }
        )
      }
    } else {
      limitCheck = limitData as VoiceLimitCheck
    }

    if (limitCheck && !limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Voice note limit reached. Upgrade to Pro for unlimited voice notes.",
          current_count: limitCheck.current_count,
          limit_count: limitCheck.limit_count,
        },
        { status: 403 }
      )
    }

    // 3. Parse form data
    const formData = await request.formData()
    const file = formData.get('audio') as File | null
    const sessionDate = formData.get('session_date') as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    // 4. Validate file
    const validation = validateAudioFile(file.size, file.type)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      )
    }

    // 5. Generate unique storage path
    const fileExt = file.name.split('.').pop() || 'mp3'
    const storagePath = `${user.id}/${nanoid()}.${fileExt}`

    // 6. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient
      .storage
      .from('voice-notes')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: "Failed to upload audio file" },
        { status: 500 }
      )
    }

    // 7. Create attachment record
    const { data: attachment, error: insertError } = await adminClient
      .from('message_attachments')
      .insert({
        user_id: user.id,
        attachment_type: 'voice',
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        original_filename: file.name,
        processing_status: 'pending',
        session_date: sessionDate || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Attachment insert error:', insertError)
      // Clean up uploaded file on error
      await adminClient.storage.from('voice-notes').remove([storagePath])
      return NextResponse.json(
        { error: `Failed to create attachment record: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 8. Increment voice note count (for free tier tracking)
    if (limitCheck && !limitCheck.is_pro) {
      await adminClient.rpc('increment_voice_note_count', { p_user_id: user.id })
    }

    const response: VoiceUploadResponse = {
      attachment_id: attachment.id,
      storage_path: storagePath,
      status: 'pending',
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Voice upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload voice note" },
      { status: 500 }
    )
  }
}
