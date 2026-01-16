"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { FeedbackReasonModal } from "@/app/components/feedback-reason-modal"

interface FeedbackButtonsProps {
  contentType: "ai_summary" | "ai_insight" | "chat_response"
  contentText: string
  reflectionId?: string
  conversationId?: string
  onFeedbackSubmitted?: (rating: "positive" | "negative") => void
}

export function FeedbackButtons({
  contentType,
  contentText,
  reflectionId,
  conversationId,
  onFeedbackSubmitted,
}: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<"positive" | "negative" | null>(null)
  const [loading, setLoading] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)

  const submitFeedback = async (
    rating: "positive" | "negative",
    reason?: string,
    reasonText?: string
  ) => {
    if (loading || submitted) return

    setLoading(true)

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType,
          content_text: contentText,
          rating,
          feedback_reason: reason,
          feedback_text: reasonText,
          reflection_id: reflectionId,
          conversation_id: conversationId,
        }),
      })

      if (res.ok) {
        setSubmitted(rating)
        onFeedbackSubmitted?.(rating)
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleNegativeClick = () => {
    setShowReasonModal(true)
  }

  const handleReasonSubmit = async (reason: string, text?: string) => {
    await submitFeedback("negative", reason, text)
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Thanks for your feedback!</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Helpful?</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => submitFeedback("positive")}
          disabled={loading}
          title="Yes, helpful"
        >
          <span className="text-xs">Yes</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNegativeClick}
          disabled={loading}
          title="Not helpful"
        >
          <span className="text-xs">No</span>
        </Button>
      </div>

      <FeedbackReasonModal
        isOpen={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        onSubmit={handleReasonSubmit}
      />
    </>
  )
}
