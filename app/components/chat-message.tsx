"use client"

import { useState } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { FeedbackButtons } from "@/app/components/feedback-buttons"
import ReactMarkdown from "react-markdown"
import type { MessageAttachment, SessionPlanAnalysis as SessionPlanAnalysisType } from "@/app/types"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  attachments?: MessageAttachment[]
  followUps?: string[]
  onFollowUpClick?: (text: string) => void
  conversationId?: string
  isLoading?: boolean
  showFeedback?: boolean
}

export function ChatMessage({
  role,
  content,
  attachments,
  followUps,
  onFollowUpClick,
  conversationId,
  isLoading = false,
  showFeedback = true,
}: ChatMessageProps) {
  const isUser = role === "user"
  const hasContent = content.trim().length > 0

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Card
        className={`max-w-[85%] ${
          isUser
            ? "bg-amber-100 dark:bg-amber-900 border-amber-200 dark:border-amber-800"
            : "bg-muted"
        }`}
      >
        <CardContent className="p-3">
          {/* Voice attachments */}
          {attachments && attachments.length > 0 && (
            <div className="space-y-2 mb-3">
              {attachments.map((attachment) => (
                <AttachmentDisplay key={attachment.id} attachment={attachment} />
              ))}
            </div>
          )}

          {/* Message content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {!hasContent && isLoading ? (
              <span className="text-muted-foreground animate-pulse">
                Thinking...
              </span>
            ) : (
              <ReactMarkdown>{content}</ReactMarkdown>
            )}
          </div>

          {/* Follow-up suggestions */}
          {followUps && followUps.length > 0 && onFollowUpClick && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Suggested follow-ups:</p>
              <div className="flex flex-wrap gap-2">
                {followUps.map((followUp, index) => (
                  <button
                    key={index}
                    onClick={() => onFollowUpClick(followUp)}
                    className="text-xs bg-background hover:bg-muted px-2 py-1 rounded border transition-colors"
                  >
                    {followUp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback buttons for assistant messages */}
          {!isUser && hasContent && !isLoading && showFeedback && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <FeedbackButtons
                contentType="chat_response"
                contentText={content}
                conversationId={conversationId}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Attachment display component
function AttachmentDisplay({ attachment }: { attachment: MessageAttachment }) {
  const [expanded, setExpanded] = useState(false)

  if (attachment.attachment_type === "voice") {
    return (
      <div className="bg-background/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          {/* Mic icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          <span className="text-xs font-medium">Voice Note</span>
          {attachment.voice_duration_seconds && (
            <span className="text-xs text-muted-foreground">
              ({formatDuration(attachment.voice_duration_seconds)})
            </span>
          )}
          {attachment.processing_status === "processing" && (
            <span className="text-xs text-amber-600 animate-pulse">
              Transcribing...
            </span>
          )}
        </div>

        {/* Transcription */}
        {attachment.voice_transcription && (
          <div className="text-sm">
            {expanded ? (
              <p className="whitespace-pre-wrap">{attachment.voice_transcription}</p>
            ) : (
              <p className="line-clamp-2">{attachment.voice_transcription}</p>
            )}
            {attachment.voice_transcription.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-brand hover:underline mt-1"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (attachment.attachment_type === "image" || attachment.attachment_type === "session_plan") {
    return (
      <div className="bg-background/50 rounded-lg p-3 space-y-2">
        <div className="flex items-start gap-3">
          {/* Image thumbnail */}
          {attachment.file_url && (
            <a
              href={attachment.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <img
                src={attachment.file_url}
                alt="Session plan"
                className="w-16 h-16 object-cover rounded border hover:opacity-80 transition-opacity"
              />
            </a>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Image icon if no thumbnail */}
              {!attachment.file_url && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              )}
              <span className="text-xs font-medium">
                {attachment.attachment_type === "session_plan" ? "Session Plan" : "Session Plan Image"}
              </span>
              {attachment.processing_status === "processing" && (
                <span className="text-xs text-amber-600 animate-pulse">
                  Analyzing...
                </span>
              )}
              {attachment.processing_status === "completed" && attachment.image_analysis && (
                <span className="text-xs text-green-600">
                  Analyzed
                </span>
              )}
            </div>

            {/* Session plan analysis */}
            {attachment.image_analysis && (
              <SessionPlanPreview analysis={attachment.image_analysis} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Session plan preview component
function SessionPlanPreview({ analysis }: { analysis: SessionPlanAnalysisType }) {
  const [expanded, setExpanded] = useState(false)

  const title = analysis.title
  const objectives = analysis.objectives
  const drills = analysis.drills

  return (
    <div className="text-sm space-y-1">
      {title && <p className="font-medium">{title}</p>}

      {expanded && (
        <>
          {objectives && objectives.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground">Objectives:</span>
              <ul className="list-disc list-inside text-xs">
                {objectives.slice(0, 3).map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
          {drills && drills.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground">Drills:</span>
              <ul className="list-disc list-inside text-xs">
                {drills.slice(0, 3).map((drill, i) => (
                  <li key={i}>{drill.name}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {(objectives?.length || drills?.length) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-brand hover:underline"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>
      )}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
