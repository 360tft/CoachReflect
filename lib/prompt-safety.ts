// Basic prompt injection detection for user messages
// This is defense-in-depth - the system prompt already constrains the AI

// Patterns that suggest prompt injection attempts
const INJECTION_PATTERNS = [
  // System prompt manipulation
  /ignore\s+(all\s+)?previous\s+(instructions|prompts)/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?(your\s+)?instructions/i,
  /you\s+are\s+now\s+(?!a\s+(coaching|reflection)\s+(companion|assistant))/i,
  /pretend\s+you\s+are\s+(?!a\s+coach)/i,
  /act\s+as\s+(?!a\s+coach|an?\s+assistant|a\s+reflection)/i,
  /roleplay\s+as/i,
  /new\s+persona/i,
  /switch\s+to\s+(?!coaching|reflection)/i,

  // Jailbreak attempts
  /dan\s*mode/i,
  /developer\s+mode/i,
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?(restrictions|guidelines|rules)/i,
  /override\s+(your\s+)?(programming|instructions)/i,

  // System/admin role injection
  /\[system\]/i,
  /\[admin\]/i,
  /\[root\]/i,
  /<system>/i,
  /```system/i,
  /instruction:\s*\n/i,

  // Attempts to extract system prompt
  /what\s+(are|is)\s+your\s+(system\s+)?prompt/i,
  /show\s+me\s+your\s+instructions/i,
  /repeat\s+your\s+initial\s+instructions/i,
  /reveal\s+your\s+(system\s+)?prompt/i,
]

// Topics that are clearly outside the coaching/reflection domain
const OFF_TOPIC_PATTERNS = [
  /how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|weapon|drug)/i,
  /illegal\s+activities/i,
  /harm\s+(yourself|others|people)/i,
]

export interface SafetyCheckResult {
  safe: boolean
  reason?: string
}

/**
 * Check if a user message appears to be a prompt injection attempt
 * @param message The user's message
 * @returns Whether the message is safe and why if not
 */
export function checkPromptSafety(message: string): SafetyCheckResult {
  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return {
        safe: false,
        reason: 'Message appears to contain prompt manipulation. Please ask coaching-related questions.',
      }
    }
  }

  // Check for clearly off-topic harmful content
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(message)) {
      return {
        safe: false,
        reason: 'This assistant helps with coaching reflection. Please ask coaching-related questions.',
      }
    }
  }

  return { safe: true }
}

/**
 * Sanitize user input by removing potential injection markers
 * This is a soft approach that cleans rather than blocks
 */
export function sanitizePromptInput(message: string): string {
  return message
    // Remove potential system message markers
    .replace(/\[system\]/gi, '')
    .replace(/\[admin\]/gi, '')
    .replace(/<system>/gi, '')
    .replace(/```system[\s\S]*?```/gi, '')
    // Trim excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Validate message length and content
 */
export function validateMessage(message: string, maxLength: number = 10000): SafetyCheckResult {
  if (!message || message.trim().length === 0) {
    return {
      safe: false,
      reason: 'Message cannot be empty.',
    }
  }

  if (message.length > maxLength) {
    return {
      safe: false,
      reason: `Message is too long. Maximum ${maxLength} characters allowed.`,
    }
  }

  return checkPromptSafety(message)
}
