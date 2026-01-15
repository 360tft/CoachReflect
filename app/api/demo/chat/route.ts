import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkRateLimit } from "@/lib/rate-limit"
import { SYSTEM_PROMPT, CHAT_CONFIG } from "@/lib/chat-config"
import { DEMO_CONFIG } from "@/lib/demo"
import { headers } from "next/headers"
import type { ChatMessage } from "@/app/types"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Stricter rate limit for demo: 5 requests per minute per IP
const DEMO_RATE_LIMIT = {
  maxRequests: 5,
  windowSeconds: 60,
}

// Get client IP for rate limiting
async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  const realIP = headersList.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  return "unknown"
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIP = await getClientIP()

    // Rate limit by IP (stricter for demo)
    const rateLimit = await checkRateLimit(`demo:${clientIP}`, DEMO_RATE_LIMIT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again.", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      message,
      history = [],
      demoCount
    }: {
      message: string
      history: ChatMessage[]
      demoCount: number
    } = body

    // Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Validate demo count (client claims how many they've used)
    if (typeof demoCount !== "number" || demoCount >= DEMO_CONFIG.MAX_MESSAGES) {
      return NextResponse.json(
        { error: "Demo limit reached. Sign up free to continue!", limit_reached: true },
        { status: 403 }
      )
    }

    // Shorter message length for demo
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long. Maximum 2000 characters for demo." },
        { status: 400 }
      )
    }

    // Demo-specific system prompt addition
    const demoSystemPrompt = SYSTEM_PROMPT + `

## Demo Mode Note
This coach is trying the demo. Be extra welcoming and helpful. Show them the value of reflection in just a few messages. End responses with an encouraging invitation to continue their reflection journey.`

    // Trim history for demo (less context)
    const trimmedHistory = history.slice(-6)

    const claudeMessages: Anthropic.MessageParam[] = trimmedHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Add current message
    claudeMessages.push({
      role: "user",
      content: message,
    })

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullResponse = ""

        try {
          // Create streaming request to Claude
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500, // Shorter for demo
            system: demoSystemPrompt,
            messages: claudeMessages,
            stream: true,
          })

          // Process stream
          for await (const event of response) {
            if (event.type === "content_block_delta") {
              const delta = event.delta
              if ("text" in delta) {
                fullResponse += delta.text

                // Send chunk via SSE
                const chunk = JSON.stringify({
                  type: "chunk",
                  content: delta.text,
                })
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
              }
            }
          }

          // Calculate remaining demo messages
          const newDemoCount = demoCount + 1
          const remaining = Math.max(0, DEMO_CONFIG.MAX_MESSAGES - newDemoCount)

          console.log(`[Demo Chat] IP: ${clientIP.slice(0, 12)}..., Demo Count: ${newDemoCount}/${DEMO_CONFIG.MAX_MESSAGES}`)

          // Send done message with metadata
          const done = JSON.stringify({
            type: "done",
            remaining,
            demo_count: newDemoCount,
            is_demo: true,
            show_signup_prompt: remaining <= 1,
            follow_ups: [
              "Tell me about your last session",
              "What's been challenging lately?",
              "What win can you celebrate?",
            ],
          })
          controller.enqueue(encoder.encode(`data: ${done}\n\n`))
          controller.close()

        } catch (error) {
          console.error("Demo streaming error:", error)
          const errorMsg = JSON.stringify({
            type: "error",
            message: "An error occurred while generating the response",
          })
          controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

  } catch (error) {
    console.error("Demo Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process demo chat request" },
      { status: 500 }
    )
  }
}
