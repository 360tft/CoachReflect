// Redis-based rate limiter for API endpoints
// Uses Upstash Redis for serverless-compatible rate limiting
// Falls back to in-memory for local development

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Chat API: 30 requests per minute per user
  CHAT: {
    maxRequests: 30,
    windowSeconds: 60,
  },
  // Auth endpoints: 5 attempts per minute (prevent brute force)
  AUTH: {
    maxRequests: 5,
    windowSeconds: 60,
  },
  // General API: 100 requests per minute
  API: {
    maxRequests: 100,
    windowSeconds: 60,
  },
  // Reflections: 20 per minute
  REFLECTIONS: {
    maxRequests: 20,
    windowSeconds: 60,
  },
} as const

// Initialize Redis client (lazy loaded)
let redis: Redis | null = null
let rateLimiters: Map<string, Ratelimit> = new Map()

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisClient = getRedis()
  if (!redisClient) return null

  // Create a unique key for this config
  const configKey = `${config.maxRequests}:${config.windowSeconds}`

  if (!rateLimiters.has(configKey)) {
    rateLimiters.set(configKey, new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowSeconds} s`),
      analytics: true,
      prefix: 'coachreflect_ratelimit',
    }))
  }

  return rateLimiters.get(configKey)!
}

// ============================================
// Fallback: In-memory rate limiter for local dev
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const inMemoryStore = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanupOldEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of inMemoryStore) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key)
    }
  }
}

function checkRateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupOldEntries()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  let entry = inMemoryStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs }
    inMemoryStore.set(identifier, entry)
  }

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000)

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetInSeconds }
  }

  entry.count++
  return { allowed: true, remaining: remaining - 1, resetInSeconds }
}

// ============================================
// Main rate limit function
// ============================================

/**
 * Check if a request should be rate limited
 * Uses Redis in production, falls back to in-memory for local dev
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const rateLimiter = getRateLimiter(config)

  // Fall back to in-memory if Redis not configured
  if (!rateLimiter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Rate limiting: Redis not configured, using in-memory fallback')
    }
    return checkRateLimitInMemory(identifier, config)
  }

  try {
    const result = await rateLimiter.limit(identifier)

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetInSeconds: Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (error) {
    // If Redis fails, fall back to in-memory and log warning
    console.error('Rate limiting Redis error, using fallback:', error)
    return checkRateLimitInMemory(identifier, config)
  }
}

/**
 * Synchronous rate limit check (for backward compatibility)
 * Note: This only uses in-memory store. Use async checkRateLimit for Redis.
 * @deprecated Use async checkRateLimit instead
 */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimitInMemory(identifier, config)
}
