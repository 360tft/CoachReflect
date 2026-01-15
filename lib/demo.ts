// Demo mode utilities - localStorage-based tracking for try-before-signup

export const DEMO_CONFIG = {
  MAX_MESSAGES: 3,
  STORAGE_KEY: 'coachreflect_demo',
}

export interface DemoState {
  messagesUsed: number
  createdAt: string
  lastMessageAt?: string
}

/**
 * Get current demo state from localStorage
 */
export function getDemoState(): DemoState {
  if (typeof window === 'undefined') {
    return { messagesUsed: 0, createdAt: new Date().toISOString() }
  }

  try {
    const stored = localStorage.getItem(DEMO_CONFIG.STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as DemoState
    }
  } catch {
    // Invalid JSON, reset
  }

  return { messagesUsed: 0, createdAt: new Date().toISOString() }
}

/**
 * Save demo state to localStorage
 */
export function saveDemoState(state: DemoState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(DEMO_CONFIG.STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage not available or full
  }
}

/**
 * Increment demo message count
 */
export function incrementDemoCount(): DemoState {
  const state = getDemoState()
  state.messagesUsed += 1
  state.lastMessageAt = new Date().toISOString()
  saveDemoState(state)
  return state
}

/**
 * Check if demo limit reached
 */
export function isDemoLimitReached(): boolean {
  const state = getDemoState()
  return state.messagesUsed >= DEMO_CONFIG.MAX_MESSAGES
}

/**
 * Get remaining demo messages
 */
export function getRemainingDemoMessages(): number {
  const state = getDemoState()
  return Math.max(0, DEMO_CONFIG.MAX_MESSAGES - state.messagesUsed)
}

/**
 * Clear demo state (useful for testing)
 */
export function clearDemoState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DEMO_CONFIG.STORAGE_KEY)
}
