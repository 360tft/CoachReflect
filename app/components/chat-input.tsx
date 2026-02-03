"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import {
  VOICE_MAX_DURATION_SECONDS,
  VOICE_MAX_FILE_SIZE,
  VOICE_SHORT_THRESHOLD_SECONDS,
  SUPPORTED_AUDIO_TYPES,
  type TranscriptionResponse,
  type SessionPlanAnalysis,
  type SubscriptionTier,
} from "@/app/types"
import { VOICE_FULL_MAX_SECONDS } from "@/lib/config"

interface ChatInputProps {
  onSend: (
    message: string,
    attachments?: {
      type: 'voice' | 'image'
      attachment_id: string
      transcription?: string
    }[]
  ) => void
  isSubscribed: boolean
  subscriptionTier?: SubscriptionTier
  remaining?: number
  disabled?: boolean
  placeholder?: string
  onUpgradeClick?: () => void
}

interface PendingAttachment {
  type: 'voice' | 'image'
  file?: File
  blob?: Blob
  previewUrl: string
  status: 'uploading' | 'transcribing' | 'analyzing' | 'ready' | 'error'
  attachment_id?: string
  transcription?: string
  analysis?: SessionPlanAnalysis
  file_url?: string
  error?: string
  duration?: number
}

export function ChatInput({
  onSend,
  isSubscribed,
  subscriptionTier = 'free',
  remaining = 5,
  disabled = false,
  placeholder = "Type your message...",
  onUpgradeClick,
}: ChatInputProps) {
  // Tier-aware recording limits
  const maxRecordingDuration = subscriptionTier === 'pro_plus'
    ? VOICE_FULL_MAX_SECONDS
    : VOICE_MAX_DURATION_SECONDS
  const maxVoiceFileSize = subscriptionTier === 'pro_plus'
    ? VOICE_MAX_FILE_SIZE.full
    : VOICE_MAX_FILE_SIZE.short
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [error, setError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const [showUpgradeHint, setShowUpgradeHint] = useState<string | null>(null)

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [input])

  const isLimitReached = !isSubscribed && remaining <= 0
  const hasReadyAttachments = attachments.some(a => a.status === 'ready')
  const isProcessing = attachments.some(a => a.status === 'uploading' || a.status === 'transcribing' || a.status === 'analyzing')
  const canSend = (input.trim() || hasReadyAttachments) && !disabled && !isLimitReached && !isProcessing

  // Handle Pro feature click for free users
  const handleProFeatureClick = useCallback((feature: string) => {
    if (!isSubscribed) {
      setShowUpgradeHint(feature)
      if (onUpgradeClick) {
        onUpgradeClick()
      }
      // Auto-hide hint after 3 seconds
      setTimeout(() => setShowUpgradeHint(null), 3000)
      return false
    }
    return true
  }, [isSubscribed, onUpgradeClick])

  // Upload voice note and get transcription
  const uploadAndTranscribe = useCallback(async (file: File | Blob, isBlob: boolean = false, recordingDurationSecs?: number) => {
    const previewUrl = URL.createObjectURL(file)
    const newAttachment: PendingAttachment = {
      type: 'voice',
      blob: isBlob ? file as Blob : undefined,
      file: isBlob ? undefined : file as File,
      previewUrl,
      status: 'uploading',
    }

    setAttachments(prev => [...prev, newAttachment])
    const attachmentIndex = attachments.length

    try {
      // Upload
      const formData = new FormData()
      const filename = isBlob ? `recording-${Date.now()}.webm` : (file as File).name
      formData.append('audio', file, filename)
      if (recordingDurationSecs !== undefined) {
        formData.append('duration', String(recordingDurationSecs))
      }

      const uploadRes = await fetch('/api/voice/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { attachment_id } = await uploadRes.json()

      // Update status to transcribing
      setAttachments(prev => prev.map((a, i) =>
        i === attachmentIndex ? { ...a, status: 'transcribing', attachment_id } : a
      ))

      // Transcribe
      const transcribeRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachment_id }),
      })

      if (!transcribeRes.ok) {
        const data = await transcribeRes.json()
        throw new Error(data.error || 'Transcription failed')
      }

      const { transcription, duration_seconds }: TranscriptionResponse = await transcribeRes.json()

      // Update to ready
      setAttachments(prev => prev.map((a, i) =>
        i === attachmentIndex ? {
          ...a,
          status: 'ready',
          transcription,
          duration: duration_seconds,
        } : a
      ))

    } catch (err) {
      setAttachments(prev => prev.map((a, i) =>
        i === attachmentIndex ? {
          ...a,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        } : a
      ))
    }
  }, [attachments.length])

  // Upload image and optionally analyze
  const uploadAndAnalyzeImage = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file)
    const newAttachment: PendingAttachment = {
      type: 'image',
      file,
      previewUrl,
      status: 'uploading',
    }

    setAttachments(prev => [...prev, newAttachment])
    const attachmentIndex = attachments.length

    try {
      // Upload
      const formData = new FormData()
      formData.append('image', file)

      const uploadRes = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { attachment_id, file_url } = await uploadRes.json()

      // Update status to analyzing
      setAttachments(prev => prev.map((a, i) =>
        i === attachmentIndex ? { ...a, status: 'analyzing', attachment_id, file_url } : a
      ))

      // Analyze with Claude Vision
      const analyzeRes = await fetch('/api/image/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachment_id }),
      })

      if (!analyzeRes.ok) {
        const data = await analyzeRes.json()
        throw new Error(data.error || 'Analysis failed')
      }

      const { analysis } = await analyzeRes.json()

      // Update to ready
      setAttachments(prev => prev.map((a, i) =>
        i === attachmentIndex ? {
          ...a,
          status: 'ready',
          analysis,
        } : a
      ))

    } catch (err) {
      setAttachments(prev => prev.map((a, i) =>
        i === attachmentIndex ? {
          ...a,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        } : a
      ))
    }
  }, [attachments.length])

  // Start recording
  const startRecording = useCallback(async () => {
    if (disabled || isLimitReached) return
    if (!handleProFeatureClick('voice')) return

    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        uploadAndTranscribe(blob, true, elapsed)
      }

      mediaRecorder.start(1000)
      startTimeRef.current = Date.now()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        setRecordingDuration(elapsed)

        if (elapsed >= maxRecordingDuration) {
          stopRecording()
        }
      }, 100)

    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.')
      } else {
        setError('Failed to start recording. Please check your microphone.')
      }
    }
  }, [disabled, isLimitReached, uploadAndTranscribe, handleProFeatureClick])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setRecordingDuration(0)
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'voice' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check Pro status for these features
    if (!handleProFeatureClick(type)) {
      e.target.value = ''
      return
    }

    if (type === 'voice') {
      if (!SUPPORTED_AUDIO_TYPES.includes(file.type as typeof SUPPORTED_AUDIO_TYPES[number])) {
        setError('Unsupported audio format. Use MP3, M4A, WAV, WebM, OGG, or FLAC.')
        return
      }
      if (file.size > maxVoiceFileSize) {
        const limitMB = Math.round(maxVoiceFileSize / (1024 * 1024))
        setError(`File too large. Maximum ${limitMB}MB.`)
        return
      }
      uploadAndTranscribe(file, false, undefined)
    } else {
      // Image upload with Claude Vision analysis
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Maximum 10MB.')
        return
      }
      uploadAndAnalyzeImage(file)
    }

    // Reset input
    e.target.value = ''
  }, [uploadAndTranscribe, uploadAndAnalyzeImage, handleProFeatureClick])

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => {
      const attachment = prev[index]
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl)
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Handle send
  const handleSend = useCallback(() => {
    if (!canSend) return

    const readyAttachments = attachments
      .filter(a => a.status === 'ready' && a.attachment_id)
      .map(a => ({
        type: a.type,
        attachment_id: a.attachment_id!,
        transcription: a.transcription,
        analysis: a.analysis,
        file_url: a.file_url,
      }))

    // Build message with transcriptions or session plan context
    let finalMessage = input.trim()
    if (!finalMessage && readyAttachments.length > 0) {
      // Use transcription or analysis as message context
      const voiceTranscriptions = readyAttachments
        .filter(a => a.type === 'voice' && a.transcription)
        .map(a => a.transcription)
        .join('\n\n')

      const imageAnalyses = readyAttachments
        .filter(a => a.type === 'image' && a.analysis)
        .map(a => {
          const analysis = a.analysis!
          return `[Session plan uploaded: ${analysis.title || 'Untitled'}]`
        })
        .join('\n')

      finalMessage = voiceTranscriptions || imageAnalyses || '[Attachment added]'
    }

    onSend(finalMessage, readyAttachments.length > 0 ? readyAttachments : undefined)

    // Cleanup
    setInput('')
    attachments.forEach(a => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
    })
    setAttachments([])

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [canSend, input, attachments, onSend])

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="border-t pt-2 md:pt-4">
      {/* Upgrade hint for Pro features */}
      {showUpgradeHint && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {showUpgradeHint === 'voice' && 'Talk through your sessions instead of typing. '}
            {showUpgradeHint === 'image' && 'Upload session plans and get AI feedback. '}
            <a href="/dashboard/settings" className="underline font-medium">Upgrade to Pro</a> to unlock.
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
            >
              {attachment.type === 'voice' ? (
                <>
                  <span className="text-muted-foreground">
                    {attachment.status === 'uploading' && 'Uploading...'}
                    {attachment.status === 'transcribing' && 'Transcribing...'}
                    {attachment.status === 'ready' && (
                      attachment.duration
                        ? `Voice (${formatDuration(attachment.duration)})`
                        : 'Voice note'
                    )}
                    {attachment.status === 'error' && (
                      <span className="text-destructive">Error: {attachment.error}</span>
                    )}
                  </span>
                  {attachment.status === 'ready' && attachment.transcription && (
                    <span className="max-w-[200px] truncate text-xs text-muted-foreground">
                      &quot;{attachment.transcription.slice(0, 50)}...&quot;
                    </span>
                  )}
                </>
              ) : (
                <>
                  {/* Image thumbnail */}
                  {attachment.previewUrl && (
                    <img
                      src={attachment.previewUrl}
                      alt="Session plan preview"
                      className="h-10 w-10 object-cover rounded"
                    />
                  )}
                  <span className="text-muted-foreground">
                    {attachment.status === 'uploading' && 'Uploading...'}
                    {attachment.status === 'analyzing' && 'Analyzing...'}
                    {attachment.status === 'ready' && (
                      attachment.analysis?.title
                        ? `Session: ${attachment.analysis.title}`
                        : 'Session plan'
                    )}
                    {attachment.status === 'error' && (
                      <span className="text-destructive">Error: {attachment.error}</span>
                    )}
                  </span>
                </>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="text-muted-foreground hover:text-foreground ml-1"
                disabled={attachment.status === 'uploading' || attachment.status === 'transcribing' || attachment.status === 'analyzing'}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="font-mono">{formatDuration(recordingDuration)}</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
          >
            Stop
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex flex-col gap-2 md:gap-3">
        {/* Attachment buttons - horizontal row above input */}
        <div className="flex gap-2 flex-wrap">
          {/* Voice record button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`gap-2 ${isRecording ? 'bg-red-100 border-red-300 dark:bg-red-900' : ''} ${!isSubscribed ? 'opacity-70' : ''}`}
            title={isRecording ? 'Stop recording' : (isSubscribed ? 'Record voice note' : 'Record voice note (Pro)')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            {isRecording ? 'Stop' : 'Voice Note'}
            {!isSubscribed && <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1 rounded">Pro</span>}
          </Button>

          {/* Voice file upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'voice')}
            disabled={disabled || isRecording}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!handleProFeatureClick('voice')) return
              fileInputRef.current?.click()
            }}
            disabled={disabled || isRecording}
            className={`gap-2 ${!isSubscribed ? 'opacity-70' : ''}`}
            title={isSubscribed ? "Upload voice file" : "Upload voice file (Pro)"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            Upload Audio
            {!isSubscribed && <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1 rounded">Pro</span>}
          </Button>

          {/* Image upload - visible to all, Pro-gated on click */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
            disabled={disabled || isRecording}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!handleProFeatureClick('image')) return
              imageInputRef.current?.click()
            }}
            disabled={disabled || isRecording}
            className={`gap-2 ${!isSubscribed ? 'opacity-70' : ''}`}
            title={isSubscribed ? "Upload session plan image" : "Upload session plan (Pro)"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            Session Plan
            {!isSubscribed && <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1 rounded">Pro</span>}
          </Button>
        </div>

        {/* Text input row */}
        <div className="flex gap-2">

        {/* Text input */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLimitReached ? 'Daily limit reached. Upgrade to continue...' : placeholder}
            disabled={disabled || isLimitReached || isRecording}
            className="resize-none min-h-[44px] md:min-h-[60px] flex-1 overflow-y-auto"
            style={{ maxHeight: '200px' }}
            rows={1}
          />

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="bg-brand hover:bg-brand-hover self-end"
          >
            {isProcessing ? '...' : 'Send'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-1 hidden md:block">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
