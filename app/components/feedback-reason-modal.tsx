'use client'

import { useState } from 'react'

interface FeedbackReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string, text?: string) => void
}

const FEEDBACK_REASONS = [
  { id: 'not_relevant', label: 'Not relevant', description: 'Advice not relevant to my coaching situation' },
  { id: 'too_generic', label: 'Too generic', description: 'Not specific enough to be useful' },
  { id: 'not_accurate', label: 'Not accurate', description: 'Information seems incorrect' },
  { id: 'didnt_answer', label: "Didn't answer my question", description: 'Missed the point of what I asked' },
  { id: 'other', label: 'Other', description: 'Something else' },
]

export function FeedbackReasonModal({ isOpen, onClose, onSubmit }: FeedbackReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [additionalText, setAdditionalText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedReason) return

    setSubmitting(true)
    await onSubmit(selectedReason, additionalText.trim() || undefined)
    setSubmitting(false)
    setSelectedReason(null)
    setAdditionalText('')
    onClose()
  }

  const handleSkip = () => {
    onSubmit('skipped')
    setSelectedReason(null)
    setAdditionalText('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          What went wrong?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Help us improve by telling us what was wrong with this response.
        </p>

        {/* Reason options */}
        <div className="space-y-2 mb-4">
          {FEEDBACK_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedReason === reason.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="font-medium text-foreground text-sm">
                {reason.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {reason.description}
              </div>
            </button>
          ))}
        </div>

        {/* Additional text (optional) */}
        {selectedReason && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Additional details (optional)
            </label>
            <textarea
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              placeholder="Tell us more about what went wrong..."
              className="w-full p-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder-muted-foreground"
              rows={2}
              maxLength={500}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || submitting}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
