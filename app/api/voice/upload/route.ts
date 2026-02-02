import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateAudioFile } from "@/lib/whisper"
import { nanoid } from "nanoid"
import type { VoiceUploadResponse } from "@/app/types"
import { VOICE_SHORT_THRESHOLD_SECONDS, VOICE_MAX_FILE_SIZE } from "@/app/types"

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

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('audio') as File | null
    const sessionDate = formData.get('session_date') as string | null
    const durationStr = formData.get('duration') as string | null
    const durationSeconds = durationStr ? Math.round(parseFloat(durationStr)) : 0

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    // 3. Classify as short or full based on duration
    const isShort = durationSeconds < VOICE_SHORT_THRESHOLD_SECONDS

    // 4. Apply tier-aware file size limit
    const maxFileSize = isShort ? VOICE_MAX_FILE_SIZE.short : VOICE_MAX_FILE_SIZE.full

    if (file.size > maxFileSize) {
      const limitMB = Math.round(maxFileSize / (1024 * 1024))
      return NextResponse.json(
        { error: `File too large. Maximum size is ${limitMB}MB${isShort ? ' for short voice notes' : ' for full recordings'}.` },
        { status: 400 }
      )
    }

    // 5. Validate audio format
    const validation = validateAudioFile(file.size, file.type)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // 6. Check voice note limit (passing duration for split limit checking)
    const adminClient = createAdminClient()
    let limitCheck: VoiceLimitCheck | null = null

    const { data: limitData, error: limitError } = await adminClient
      .rpc('check_voice_note_limit', {
        p_user_id: user.id,
        p_duration_seconds: durationSeconds,
      })
      .single()

    if (limitError) {
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
      const upgradeMessage = limitCheck.limit_count === 0
        ? "Voice notes require a Pro subscription."
        : `Voice note limit reached (${limitCheck.current_count}/${limitCheck.limit_count} this month). Upgrade for more.`
      return NextResponse.json(
        {
          error: upgradeMessage,
          current_count: limitCheck.current_count,
          limit_count: limitCheck.limit_count,
        },
        { status: 403 }
      )
    }

    // 7. Generate unique storage path
    const fileExt = file.name.split('.').pop() || 'mp3'
    const storagePath = `${user.id}/${nanoid()}.${fileExt}`

    // 8. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Strip codec suffix (e.g., "audio/webm;codecs=opus" -> "audio/webm")
    const contentType = file.type.split(';')[0].trim()

    const { error: uploadError } = await adminClient
      .storage
      .from('voice-notes')
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload audio file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 9. Create attachment record
    const { data: attachment, error: insertError } = await adminClient
      .from('message_attachments')
      .insert({
        user_id: user.id,
        attachment_type: 'voice',
        storage_path: storagePath,
        mime_type: contentType,
        file_size_bytes: file.size,
        original_filename: file.name,
        processing_status: 'pending',
        session_date: sessionDate || null,
      })
      .select('id')
      .single()

    if (insertError) {
      // Clean up uploaded file on error
      await adminClient.storage.from('voice-notes').remove([storagePath])
      return NextResponse.json(
        { error: `Failed to create attachment record: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 10. Increment voice note count (passing duration for correct counter)
    await adminClient.rpc('increment_voice_note_count', {
      p_user_id: user.id,
      p_duration_seconds: durationSeconds,
    })

    const response: VoiceUploadResponse = {
      attachment_id: attachment.id,
      storage_path: storagePath,
      status: 'pending',
    }

    return NextResponse.json(response)

  } catch {
    return NextResponse.json(
      { error: "Failed to upload voice note" },
      { status: 500 }
    )
  }
}
