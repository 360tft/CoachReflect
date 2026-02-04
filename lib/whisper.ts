// OpenAI Whisper API Integration for Voice Transcription
// Cost: ~$0.006 per minute of audio

import OpenAI from 'openai'
import { execFileSync } from 'child_process'
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

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

const WHISPER_MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const CHUNK_DURATION_SECONDS = 600 // 10 minutes per chunk

/**
 * Transcribe audio, automatically chunking large files that exceed Whisper's 25MB limit.
 * Uses ffmpeg to split large files into 10-minute segments, transcribes each,
 * and stitches the results together.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  if (audioBuffer.length <= WHISPER_MAX_FILE_SIZE) {
    return transcribeSingleFile(audioBuffer, filename, options)
  }

  return transcribeChunked(audioBuffer, filename, options)
}

/**
 * Transcribe a single audio file (must be under 25MB)
 */
async function transcribeSingleFile(
  audioBuffer: Buffer,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const openai = getOpenAI()

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
 * Get the path to the ffmpeg binary from ffmpeg-static
 */
function getFfmpegPath(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('ffmpeg-static') as string
  } catch {
    throw new Error('ffmpeg-static is not installed')
  }
}

/**
 * Transcribe a large audio file by splitting into chunks with ffmpeg.
 * Re-encodes to mono 64kbps 16kHz MP3 (optimal for speech, minimises chunk size).
 * Passes trailing context from each chunk to the next for continuity.
 */
async function transcribeChunked(
  audioBuffer: Buffer,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const ffmpegPath = getFfmpegPath()
  const tmpDir = join('/tmp', `whisper-chunk-${randomUUID()}`)
  mkdirSync(tmpDir, { recursive: true })

  const inputPath = join(tmpDir, `input_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
  writeFileSync(inputPath, audioBuffer)

  try {
    // Get total duration using ffmpeg (stderr output contains duration info)
    let totalDuration = 0
    try {
      // Use ffmpeg to probe duration by attempting a null output
      const result = execFileSync(ffmpegPath, [
        '-i', inputPath,
        '-f', 'null',
        '-',
      ], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      // Duration parsing from stdout/stderr
      const durationMatch = result.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
      if (durationMatch) {
        totalDuration = parseInt(durationMatch[1]) * 3600
          + parseInt(durationMatch[2]) * 60
          + parseInt(durationMatch[3])
      }
    } catch (err: unknown) {
      // ffmpeg writes info to stderr even on success
      const stderr = err && typeof err === 'object' && 'stderr' in err ? String(err.stderr) : ''
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
      if (durationMatch) {
        totalDuration = parseInt(durationMatch[1]) * 3600
          + parseInt(durationMatch[2]) * 60
          + parseInt(durationMatch[3])
      }
    }

    // If we couldn't get duration, estimate from file size (rough: 1MB per minute for compressed audio)
    if (totalDuration === 0) {
      totalDuration = Math.ceil(audioBuffer.length / (1024 * 1024)) * 60
    }

    const numChunks = Math.ceil(totalDuration / CHUNK_DURATION_SECONDS)

    // Split into chunks, re-encoding to lightweight mono MP3
    const chunkPaths: string[] = []
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * CHUNK_DURATION_SECONDS
      const chunkPath = join(tmpDir, `chunk_${i}.mp3`)

      execFileSync(ffmpegPath, [
        '-i', inputPath,
        '-ss', String(startTime),
        '-t', String(CHUNK_DURATION_SECONDS),
        '-acodec', 'libmp3lame',
        '-ab', '64k',
        '-ar', '16000',
        '-ac', '1',
        '-y',
        chunkPath,
      ], { stdio: 'pipe' })

      chunkPaths.push(chunkPath)
    }

    // Filter out empty chunks (last chunk might be empty if duration estimate was high)
    const validChunkPaths = chunkPaths.filter(p => {
      try {
        const stat = readFileSync(p)
        return stat.length > 1000 // ignore chunks smaller than 1KB
      } catch {
        return false
      }
    })

    // Transcribe each chunk, passing trailing context for continuity
    const transcriptions: string[] = []
    let accumulatedDuration = 0
    let previousContext = ''

    for (const chunkPath of validChunkPaths) {
      const chunkBuffer = readFileSync(chunkPath)

      // Use the last ~200 chars of previous transcription as context prompt
      const contextPrompt = previousContext
        ? `${getCoachingPrompt()}\n\nPrevious context: ...${previousContext}`
        : options.prompt || getCoachingPrompt()

      const result = await transcribeSingleFile(chunkBuffer, 'chunk.mp3', {
        ...options,
        prompt: contextPrompt,
      })

      transcriptions.push(result.text)
      accumulatedDuration += result.duration_seconds

      // Keep last 200 chars for next chunk's context
      previousContext = result.text.slice(-200)
    }

    return {
      text: transcriptions.join(' '),
      duration_seconds: accumulatedDuration || totalDuration,
      language: 'en',
    }
  } finally {
    // Clean up temp files
    try {
      rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Transcribe audio from a URL (Supabase Storage)
 */
export async function transcribeFromUrl(
  audioUrl: string,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
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
  return Math.ceil(minutes * 0.006 * 100) / 100
}

/**
 * Validate audio file before transcription.
 * No longer rejects files over 25MB since chunked transcription handles them.
 */
export function validateAudioFile(
  fileSize: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const MAX_SIZE = 100 * 1024 * 1024 // 100MB (storage limit for Pro+)
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
      error: `File too large. Maximum size is 100MB, got ${Math.round(fileSize / 1024 / 1024)}MB`,
    }
  }

  const baseType = mimeType.split(';')[0].trim()
  if (!SUPPORTED_TYPES.includes(baseType)) {
    return {
      valid: false,
      error: `Unsupported audio format: ${mimeType}. Supported formats: MP3, M4A, WAV, WebM, OGG, FLAC`,
    }
  }

  return { valid: true }
}
