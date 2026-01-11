"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"

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

  const submitFeedback = async (rating: "positive" | "negative") => {
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

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{submitted === "positive" ? "👍" : "👎"}</span>
        <span>Thanks for your feedback!</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">Helpful?</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => submitFeedback("positive")}
        disabled={loading}
        title="Yes, helpful"
      >
        <span className="text-sm">👍</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => submitFeedback("negative")}
        disabled={loading}
        title="Not helpful"
      >
        <span className="text-sm">👎</span>
      </Button>
    </div>
  )
}
