// OpenAI Whisper API Integration for Voice Transcription
// Cost: ~$0.006 per minute of audio

import OpenAI from 'openai'

// Lazy-load OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

export interface TranscriptionResult {
  text: string
  duration_seconds: number
  language: string | null
}

export interface TranscriptionOptions {
  language?: string  // ISO-639-1 code (e.g., 'en', 'es', 'fr')
  prompt?: string    // Context hint for better accuracy
}

/**
 * Transcribe audio using OpenAI Whisper API
 *
 * @param audioBuffer - Audio file as Buffer
 * @param filename - Original filename (helps Whisper identify format)
 * @param options - Optional transcription settings
 * @returns Transcription result with text and metadata
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const openai = getOpenAI()

  // Create a File-like object for the API
  // Convert Buffer to Uint8Array for File constructor compatibility
  const uint8Array = new Uint8Array(audioBuffer)
  const file = new File([uint8Array], filename, {
    type: getMimeType(filename),
  })

  try {
    const response = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: options.language,
      prompt: options.prompt || getCoachingPrompt(),
      response_format: 'verbose_json',
    })

    return {
      text: response.text,
      duration_seconds: response.duration || 0,
      language: response.language || null,
    }
  } catch (error) {
    console.error('Whisper transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
}

/**
 * Transcribe audio from a URL (Supabase Storage)
 *
 * @param audioUrl - URL to the audio file
 * @param filename - Original filename
 * @param options - Optional transcription settings
 * @returns Transcription result
 */
export async function transcribeFromUrl(
  audioUrl: string,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  // Fetch the audio file
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch audio from URL: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return transcribeAudio(buffer, filename, options)
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'm4a': 'audio/mp4',
    'wav': 'audio/wav',
    'webm': 'audio/webm',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
  }
  return mimeTypes[ext || ''] || 'audio/mpeg'
}

/**
 * Coaching-specific prompt to improve transcription accuracy
 * Includes common football/coaching terminology
 */
function getCoachingPrompt(): string {
  return `This is a football coaching voice note. Common terms include:
    - Player positions: striker, midfielder, defender, goalkeeper, winger, full-back, centre-back
    - Tactical terms: pressing, transition, shape, spacing, possession, counter-attack
    - Training terms: drill, exercise, rondo, small-sided game, scrimmage
    - Common phrases: "worked well", "needs improvement", "struggled with", "stood out"
    - Player names may be mentioned frequently`
}

/**
 * Estimate transcription cost
 * Whisper costs $0.006 per minute
 */
export function estimateCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  return Math.ceil(minutes * 0.006 * 100) / 100  // Round up to cents
}

/**
 * Validate audio file before transcription
 */
export function validateAudioFile(
  fileSize: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const MAX_SIZE = 25 * 1024 * 1024  // 25MB (Whisper API limit)
  const SUPPORTED_TYPES = [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/flac',
    'audio/x-m4a',
  ]

  if (fileSize > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is 25MB, got ${Math.round(fileSize / 1024 / 1024)}MB`,
    }
  }

  // Check if mime type starts with any supported type (handles codec suffixes like "audio/webm;codecs=opus")
  const baseType = mimeType.split(';')[0].trim()
  if (!SUPPORTED_TYPES.includes(baseType)) {
    return {
      valid: false,
      error: `Unsupported audio format: ${mimeType}. Supported formats: MP3, M4A, WAV, WebM, OGG, FLAC`,
    }
  }

  return { valid: true }
}
