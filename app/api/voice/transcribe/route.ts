import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { transcribeAudio } from "@/lib/whisper"
import type { TranscriptionResponse } from "@/app/types"

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

    // 2. Get attachment ID
    const { attachment_id } = await request.json()

    if (!attachment_id) {
      return NextResponse.json(
        { error: "No attachment_id provided" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 3. Get attachment record
    const { data: attachment, error: fetchError } = await adminClient
      .from('message_attachments')
      .select('*')
      .eq('id', attachment_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      )
    }

    // 4. Check if already processed
    if (attachment.processing_status === 'completed') {
      const response: TranscriptionResponse = {
        transcription: attachment.voice_transcription || '',
        duration_seconds: attachment.voice_duration_seconds || 0,
        attachment_id: attachment.id,
      }
      return NextResponse.json(response)
    }

    // 5. Check if not voice type
    if (attachment.attachment_type !== 'voice') {
      return NextResponse.json(
        { error: "Attachment is not a voice note" },
        { status: 400 }
      )
    }

    // 6. Update status to processing
    await adminClient
      .from('message_attachments')
      .update({ processing_status: 'processing' })
      .eq('id', attachment_id)

    // 7. Download file from storage
    const { data: fileData, error: downloadError } = await adminClient
      .storage
      .from('voice-notes')
      .download(attachment.storage_path)

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError)
      await adminClient
        .from('message_attachments')
        .update({
          processing_status: 'failed',
          processing_error: 'Failed to download audio file',
        })
        .eq('id', attachment_id)

      return NextResponse.json(
        { error: "Failed to download audio file" },
        { status: 500 }
      )
    }

    // 8. Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 9. Transcribe with Whisper
    let transcription
    try {
      transcription = await transcribeAudio(
        buffer,
        attachment.original_filename || 'audio.mp3',
        { language: 'en' }  // Default to English for coaching context
      )
    } catch (whisperError) {
      console.error('Whisper transcription error:', whisperError)
      await adminClient
        .from('message_attachments')
        .update({
          processing_status: 'failed',
          processing_error: 'Transcription failed',
        })
        .eq('id', attachment_id)

      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: 500 }
      )
    }

    // 10. Update attachment with transcription
    const { error: updateError } = await adminClient
      .from('message_attachments')
      .update({
        processing_status: 'completed',
        voice_transcription: transcription.text,
        voice_duration_seconds: Math.round(transcription.duration_seconds),
        processed_at: new Date().toISOString(),
      })
      .eq('id', attachment_id)

    if (updateError) {
      console.error('Update error:', updateError)
      // Still return the transcription even if update fails
    }

    const response: TranscriptionResponse = {
      transcription: transcription.text,
      duration_seconds: Math.round(transcription.duration_seconds),
      attachment_id: attachment_id,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Voice transcribe error:", error)
    return NextResponse.json(
      { error: "Failed to transcribe voice note" },
      { status: 500 }
    )
  }
}
