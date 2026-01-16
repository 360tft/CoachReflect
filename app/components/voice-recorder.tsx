"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "./ui/button"
import { VOICE_MAX_DURATION_SECONDS, SUPPORTED_AUDIO_TYPES } from "@/app/types"

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onFileSelect: (file: File) => void
  onRemove: () => void
  hasRecording: boolean
  disabled?: boolean
  maxDuration?: number
}

export function VoiceRecorder({
  onRecordingComplete,
  onFileSelect,
  onRemove,
  hasRecording,
  disabled = false,
  maxDuration = VOICE_MAX_DURATION_SECONDS,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    if (disabled) return

    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })

        // Create preview URL
        const url = URL.createObjectURL(blob)
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        setAudioUrl(url)
        setRecordingDuration(duration)
        setUploadedFileName(null)

        onRecordingComplete(blob, duration)
      }

      mediaRecorder.start(1000)  // Collect data every second
      startTimeRef.current = Date.now()
      setIsRecording(true)

      // Timer for duration display
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        setRecordingDuration(elapsed)

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording()
        }
      }, 100)

    } catch (err) {
      console.error('Recording error:', err)
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.')
      } else {
        setError('Failed to start recording. Please check your microphone.')
      }
    }
  }, [disabled, maxDuration, audioUrl, onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    setIsRecording(false)
  }, [])

  const handleRemove = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setRecordingDuration(0)
    setUploadedFileName(null)
    onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [audioUrl, onRemove])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!SUPPORTED_AUDIO_TYPES.includes(file.type as typeof SUPPORTED_AUDIO_TYPES[number])) {
      setError('Unsupported audio format. Please use MP3, M4A, WAV, WebM, OGG, or FLAC.')
      return
    }

    // Validate size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.')
      return
    }

    setError(null)

    // Create preview URL
    const url = URL.createObjectURL(file)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(url)
    setUploadedFileName(file.name)
    setRecordingDuration(0)  // Unknown duration for uploaded files

    onFileSelect(file)
  }, [audioUrl, onFileSelect])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Show preview if we have a recording
  if (hasRecording && audioUrl) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-4">
        <div className="flex items-center gap-4">
          {/* Audio preview */}
          <div className="flex-1 min-w-0">
            <audio
              src={audioUrl}
              controls
              className="w-full h-10"
            />
            {uploadedFileName && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {uploadedFileName}
              </p>
            )}
            {!uploadedFileName && recordingDuration > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Duration: {formatDuration(recordingDuration)}
              </p>
            )}
          </div>
          {/* Remove button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {isRecording ? (
        // Recording state
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-lg font-mono font-medium">
              {formatDuration(recordingDuration)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Recording... (max {formatDuration(maxDuration)})
          </p>
          <Button
            type="button"
            variant="default"
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600"
          >
            Stop Recording
          </Button>
        </div>
      ) : (
        // Idle state
        <div className="space-y-4">
          <div>
            <p className="font-medium">Record a voice note</p>
            <p className="text-sm text-muted-foreground mt-1">
              Or upload an existing audio file
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              type="button"
              variant="default"
              onClick={startRecording}
              disabled={disabled}
              className="bg-brand hover:bg-brand-hover"
            >
              Start Recording
            </Button>

            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
              />
              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4">
                Upload File
              </span>
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            MP3, M4A, WAV, WebM • Max {formatDuration(maxDuration)} • Max 50MB
          </p>
        </div>
      )}
    </div>
  )
}
