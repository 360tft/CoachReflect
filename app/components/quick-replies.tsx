"use client"

import { Button } from "@/app/components/ui/button"

export type QuickReplyType = 'mood' | 'energy' | 'yes_no' | 'custom'

export interface QuickReplyOption {
  label: string
  value: string | number
  emoji?: string
}

interface QuickRepliesProps {
  type: QuickReplyType
  options?: QuickReplyOption[]
  onSelect: (value: string | number, label: string) => void
  disabled?: boolean
}

// Pre-defined option sets
const MOOD_OPTIONS: QuickReplyOption[] = [
  { label: "Great", value: 5, emoji: "" },
  { label: "Good", value: 4, emoji: "" },
  { label: "Okay", value: 3, emoji: "" },
  { label: "Tough", value: 2, emoji: "" },
  { label: "Drained", value: 1, emoji: "" },
]

const ENERGY_OPTIONS: QuickReplyOption[] = [
  { label: "High", value: 5, emoji: "" },
  { label: "Good", value: 4, emoji: "" },
  { label: "Medium", value: 3, emoji: "" },
  { label: "Low", value: 2, emoji: "" },
  { label: "Empty", value: 1, emoji: "" },
]

const YES_NO_OPTIONS: QuickReplyOption[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
]

export function QuickReplies({ type, options, onSelect, disabled = false }: QuickRepliesProps) {
  // Get options based on type
  const displayOptions = options || getOptionsForType(type)

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {displayOptions.map((option) => (
        <Button
          key={String(option.value)}
          variant="outline"
          size="sm"
          onClick={() => onSelect(option.value, option.label)}
          disabled={disabled}
          className="h-auto py-2 px-4 hover:bg-primary/10 hover:border-primary"
        >
          {option.emoji && <span className="mr-1">{option.emoji}</span>}
          {option.label}
        </Button>
      ))}
    </div>
  )
}

function getOptionsForType(type: QuickReplyType): QuickReplyOption[] {
  switch (type) {
    case 'mood':
      return MOOD_OPTIONS
    case 'energy':
      return ENERGY_OPTIONS
    case 'yes_no':
      return YES_NO_OPTIONS
    default:
      return []
  }
}

// Helper to parse quick reply data from AI response
export interface ParsedQuickReply {
  type: QuickReplyType
  options?: QuickReplyOption[]
  field?: string // Field name for data extraction (e.g., 'mood_rating', 'energy_rating')
}

export function parseQuickReplyFromMessage(content: string): ParsedQuickReply | null {
  // Look for special markers in AI response that indicate quick reply needed
  // Format: [QUICK_REPLY:type:field] e.g., [QUICK_REPLY:mood:mood_rating]
  const match = content.match(/\[QUICK_REPLY:(\w+):?(\w+)?\]/)
  if (!match) return null

  const type = match[1] as QuickReplyType
  const field = match[2]

  return { type, field }
}

// Remove the quick reply marker from displayed content
export function stripQuickReplyMarker(content: string): string {
  return content.replace(/\[QUICK_REPLY:\w+:?\w*\]/g, '').trim()
}
