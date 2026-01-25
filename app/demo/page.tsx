'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { getDemoState, incrementDemoCount, DEMO_CONFIG, getRemainingDemoMessages, isDemoLimitReached } from '@/lib/demo'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [remaining, setRemaining] = useState(DEMO_CONFIG.MAX_MESSAGES)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [followUps, setFollowUps] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize remaining count from localStorage
  useEffect(() => {
    setRemaining(getRemainingDemoMessages())
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim()
    if (!userMessage || isLoading) return

    // Check demo limit BEFORE sending
    if (isDemoLimitReached()) {
      setShowSignupModal(true)
      return
    }

    setInput('')
    setIsLoading(true)
    setFollowUps([])

    // Add user message
    const userMsgId = crypto.randomUUID()
    const userMsg: Message = { id: userMsgId, role: 'user', content: userMessage }
    setMessages(prev => [...prev, userMsg])

    // Add placeholder for assistant message
    const assistantMsgId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

    try {
      const demoState = getDemoState()

      const response = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          demoCount: demoState.messagesUsed,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.limit_reached) {
          setShowSignupModal(true)
          setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
          return
        }
        throw new Error(errorData.error || 'Failed to send message')
      }

      // Stream the response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'chunk') {
                fullMessage += data.content
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId ? { ...m, content: fullMessage } : m
                  )
                )
              } else if (data.type === 'done') {
                setRemaining(data.remaining)
                incrementDemoCount()
                if (data.show_signup_prompt) {
                  setTimeout(() => setShowSignupModal(true), 1500)
                }
                if (data.follow_ups) {
                  setFollowUps(data.follow_ups)
                }
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Demo chat error:', error)
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-amber-800 dark:text-amber-200">Coach Reflection</span>
            <Badge variant="secondary" className="ml-2">Demo</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {remaining} message{remaining !== 1 ? 's' : ''} left
            </span>
            <Link href="/signup">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Sign Up Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl flex flex-col">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-4">
              <span className="text-2xl">🤔</span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-amber-900 dark:text-amber-100">Try Coach Reflection</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              I&apos;m your AI coaching reflection partner. Share what&apos;s on your mind and I&apos;ll help you process and grow.
            </p>
            <div className="grid gap-2 w-full max-w-md">
              <p className="text-sm text-muted-foreground mb-2">Try sharing:</p>
              {[
                "I just had a tough session with my U12s...",
                "How can I help a player who's lost confidence?",
                "What made my session work well today?",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 border-amber-200 dark:border-amber-800"
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-[85%] p-4 ${
                    message.role === 'user'
                      ? 'bg-amber-600 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </Card>
              </div>
            ))}

            {/* Follow-up suggestions */}
            {followUps.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 mt-4">
                {followUps.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs border-amber-200 dark:border-amber-800"
                    onClick={() => sendMessage(suggestion)}
                    disabled={isDemoLimitReached()}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="border-t pt-4 mt-auto">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={remaining > 0 ? "What's on your mind after your session?" : "Demo limit reached - sign up to continue!"}
              disabled={isLoading || remaining <= 0}
              className="flex-1 resize-none rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              rows={2}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || remaining <= 0}
              className="bg-amber-600 hover:bg-amber-700 self-end"
            >
              {isLoading ? '...' : 'Send'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {remaining > 0
              ? `${remaining} free message${remaining !== 1 ? 's' : ''} remaining`
              : 'Sign up free to continue your reflection journey'}
          </p>
        </div>
      </main>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h2 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-100">
                {remaining <= 0 ? "You've used all 3 demo messages!" : 'Ready to grow as a coach?'}
              </h2>
              <p className="text-muted-foreground mb-6">
                Sign up free to get 5 messages per day, track your reflections over time, and unlock AI-powered insights.
              </p>
              <div className="space-y-3">
                <Link href="/signup" className="block">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                    Sign Up Free
                  </Button>
                </Link>
                <Link href="/signup?plan=pro" className="block">
                  <Button variant="outline" className="w-full">
                    Go Pro - Unlimited Reflections
                  </Button>
                </Link>
                {remaining > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowSignupModal(false)}
                  >
                    Continue Demo
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
