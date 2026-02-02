"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { FeedbackButtons } from "@/app/components/feedback-buttons"
import { ChatInput } from "@/app/components/chat-input"
import { QuickReplies, parseQuickReplyFromMessage, stripQuickReplyMarker, type ParsedQuickReply } from "@/app/components/quick-replies"
import { CHAT_STARTERS, type ChatMessage, type Conversation } from "@/app/types"

interface ChatInterfaceProps {
  isSubscribed: boolean
  initialRemaining?: number
}

export function ChatInterface({ isSubscribed, initialRemaining = 5 }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [activeQuickReply, setActiveQuickReply] = useState<ParsedQuickReply | null>(null)
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [autoSaveTriggered, setAutoSaveTriggered] = useState(false)
  const [finalExtractionDone, setFinalExtractionDone] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (err) {
    }
  }

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setConversationId(id)
        setMessages(
          data.messages.map((m: { role: string; content: string; created_at: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.created_at),
          }))
        )
        setShowSidebar(false)
      }
    } catch (err) {
    }
  }

  const startNewChat = () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setMessages([])
    setConversationId(null)
    setError(null)
    setShowSidebar(false)
  }

  const deleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (conversationId === id) {
          startNewChat()
        }
      }
    } catch (err) {
    }
  }

  const sendMessage = useCallback(async (
    messageText?: string,
    attachments?: { type: 'voice' | 'image'; attachment_id: string; transcription?: string }[]
  ) => {
    const text = messageText || input.trim()
    if ((!text && !attachments?.length) || loading) return

    // Check free tier limit
    if (!isSubscribed && remaining <= 0) {
      setError("You've used your 5 reflections for today. Upgrade to Pro to reflect without limits, talk through sessions, and let AI spot patterns — from $7.99/month.")
      return
    }

    setError(null)
    setInput("")
    setLoading(true)

    // Build display text - include transcription indicator if voice note
    let displayText = text
    if (attachments?.some(a => a.type === 'voice' && a.transcription)) {
      const voiceText = attachments
        .filter(a => a.type === 'voice' && a.transcription)
        .map(a => a.transcription)
        .join('\n\n')
      displayText = text ? `${text}\n\n[Voice note]: ${voiceText}` : `[Voice note]: ${voiceText}`
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: "user",
      content: displayText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // Add placeholder for assistant response
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          conversationId,
          attachments,
        }),
        signal: abortControllerRef.current.signal,
      })

      // Check for non-streaming error response
      if (!res.ok) {
        const data = await res.json()
        if (data.limit_reached) {
          setRemaining(0)
        }
        throw new Error(data.error || "Failed to send message")
      }

      // Handle streaming response
      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let assistantContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "chunk") {
                assistantContent += data.content
                // Update last message with new content
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: assistantContent,
                  }
                  return newMessages
                })
              } else if (data.type === "done") {
                // Update conversation ID and remaining count
                if (data.conversation_id) {
                  setConversationId(data.conversation_id)
                }
                if (typeof data.remaining === "number" && data.remaining >= 0) {
                  setRemaining(data.remaining)
                }
                // Update follow-ups
                if (data.follow_ups) {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      followUps: data.follow_ups,
                    }
                    return newMessages
                  })
                }
                // Reload conversations list
                loadConversations()
              } else if (data.type === "error") {
                throw new Error(data.message)
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, remove placeholder message
        setMessages(prev => prev.slice(0, -1))
      } else {
        setError(err instanceof Error ? err.message : "Failed to send message")
        // Remove placeholder message on error
        setMessages(prev => prev.slice(0, -1))
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [input, loading, messages, conversationId, isSubscribed, remaining])

  // Check for quick reply in the last message whenever messages change
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        const parsed = parseQuickReplyFromMessage(lastMessage.content)
        setActiveQuickReply(parsed)
      } else {
        setActiveQuickReply(null)
      }
    }
  }, [messages, loading])

  // Handle quick reply selection
  const handleQuickReplySelect = useCallback((value: string | number, label: string) => {
    // Send the response as a message
    sendMessage(label)
    setActiveQuickReply(null)
  }, [sendMessage])

  // Auto-save reflection after enough messages (4+ total, meaning 2 user + 2 assistant)
  useEffect(() => {
    const shouldAutoSave =
      messages.length >= 4 &&
      !loading &&
      conversationId &&
      !reflectionSaved &&
      !autoSaveTriggered

    if (shouldAutoSave) {
      setAutoSaveTriggered(true)

      // Save in background - don't block UI
      fetch("/api/insights/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, createReflection: true }),
      })
        .then(res => res.json())
        .then(() => {
          setReflectionSaved(true)
        })
        .catch(() => {
          // Don't show error to user - it's a background operation
        })
    }
  }, [messages.length, loading, conversationId, reflectionSaved, autoSaveTriggered])

  // Final extraction when reflection is complete (AI sends [REFLECTION_COMPLETE] marker)
  useEffect(() => {
    if (finalExtractionDone || !conversationId || loading) return

    // Check if last assistant message contains the completion marker
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
    if (lastAssistantMessage?.content.includes('[REFLECTION_COMPLETE]')) {
      setFinalExtractionDone(true)

      // Trigger final extraction with updateExisting to capture all data
      fetch("/api/insights/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, createReflection: true, updateExisting: true }),
      })
        .then(res => res.json())
        .then(() => {
          setReflectionSaved(true)
        })
        .catch(() => {
          // Silent fail - partial data already saved
        })
    }
  }, [messages, loading, conversationId, finalExtractionDone])

  // Reset reflection saved state when starting a new chat
  const startNewChatWithReset = useCallback(() => {
    startNewChat()
    setReflectionSaved(false)
    setAutoSaveTriggered(false)
    setFinalExtractionDone(false)
  }, [startNewChat])

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar - Conversations */}
      <div className={`
        ${showSidebar ? "block" : "hidden"}
        md:block
        w-64 shrink-0 border-r pr-4
        absolute md:relative z-10 bg-background md:bg-transparent
        h-full md:h-auto
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Conversations</h3>
          <Button size="sm" variant="outline" onClick={startNewChatWithReset}>
            New
          </Button>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-[calc(100%-3rem)]">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`
                  group flex items-center justify-between p-2 rounded-lg cursor-pointer
                  hover:bg-muted transition-colors
                  ${conversationId === conv.id ? "bg-muted" : ""}
                `}
                onClick={() => loadConversation(conv.id)}
              >
                <span className="text-sm truncate flex-1">
                  {conv.title || "Untitled"}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                >
                  <span className="text-xs">×</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden mb-2 self-start"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? "Hide" : "History"}
        </Button>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-2">Coaching Reflection Chat</h2>
              <p className="text-muted-foreground mb-8 text-center max-w-md">
                Reflect on your sessions, talk through challenges, or plan your next training.
              </p>

              {/* Chat Starters */}
              <div className="grid gap-4 max-w-2xl">
                {CHAT_STARTERS.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {category.category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {category.prompts.map((prompt) => (
                        <Button
                          key={prompt}
                          variant="outline"
                          size="sm"
                          className="text-left h-auto py-2 px-3"
                          onClick={() => sendMessage(prompt)}
                          disabled={loading}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isLastMessage = i === messages.length - 1
                const displayContent = msg.role === 'assistant' && msg.content
                  ? stripQuickReplyMarker(msg.content).replace(/\[REFLECTION_COMPLETE\]/g, '').trim()
                  : msg.content

                return (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <Card className={`max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-primary/10 dark:bg-primary/10 border dark:border"
                        : "bg-muted"
                    }`}>
                      <CardContent className="p-3">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {displayContent ? (
                            <ReactMarkdown>{displayContent}</ReactMarkdown>
                          ) : (
                            <span className="text-muted-foreground animate-pulse">
                              Thinking...
                            </span>
                          )}
                        </div>
                        {/* Show quick reply buttons for the last assistant message */}
                        {msg.role === "assistant" && isLastMessage && activeQuickReply && !loading && (
                          <QuickReplies
                            type={activeQuickReply.type}
                            options={activeQuickReply.options}
                            onSelect={handleQuickReplySelect}
                            disabled={loading}
                          />
                        )}
                        {msg.role === "assistant" && msg.content && !loading && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <FeedbackButtons
                              contentType="chat_response"
                              contentText={msg.content}
                              conversationId={conversationId || undefined}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Auto-saved indicator - subtle notification */}
        {reflectionSaved && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Reflection saved to History
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Free Tier Warning */}
        {!isSubscribed && remaining <= 2 && remaining > 0 && (
          <div className="bg-muted/50 dark:bg-background border border dark:border rounded-lg p-3 mb-4">
            <p className="text-sm text-primary dark:text-primary">
              {remaining} message{remaining === 1 ? "" : "s"} remaining today.{" "}
              <a href="/dashboard/settings" className="underline font-medium">
                Upgrade to Pro
              </a>{" "}
              to reflect without limits and talk through sessions.
            </p>
          </div>
        )}

        {/* Input Area */}
        <ChatInput
          onSend={sendMessage}
          isSubscribed={isSubscribed}
          remaining={remaining}
          disabled={loading}
          placeholder={
            !isSubscribed && remaining <= 0
              ? "Daily limit reached. Upgrade to Pro to keep reflecting..."
              : "Type your message, or add a voice note..."
          }
        />
      </div>
    </div>
  )
}
