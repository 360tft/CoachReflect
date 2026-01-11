import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { SYSTEM_PROMPT, CHAT_CONFIG, buildUserContext } from "@/lib/chat-config"
import type { ChatMessage } from "@/app/types"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Admin client for bypassing RLS when saving messages
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Helper to generate conversation title from first message
function generateTitle(message: string): string {
  // Take first 50 chars, cut at word boundary
  const truncated = message.slice(0, 60)
  const lastSpace = truncated.lastIndexOf(" ")
  if (lastSpace > 40) {
    return truncated.slice(0, lastSpace) + "..."
  }
  return truncated.length < message.length ? truncated + "..." : truncated
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get profile and check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const isSubscribed = profile?.subscription_tier !== "free"

    // Free tier can use chat but with limits (5 messages/day)
    if (!isSubscribed) {
      // Check daily usage
      const today = new Date().toISOString().split("T")[0]
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00.000Z`)
        .eq("role", "user")

      if ((count || 0) >= 5) {
        return NextResponse.json(
          {
            error: "You've reached your daily chat limit. Upgrade to Pro for unlimited conversations.",
            limit_reached: true,
            remaining: 0
          },
          { status: 403 }
        )
      }
    }

    // Parse request body
    const body = await request.json()
    const {
      message,
      history = [],
      conversationId
    }: {
      message: string
      history: ChatMessage[]
      conversationId?: string
    } = body

    // Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    if (message.length > CHAT_CONFIG.maxMessageLength) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${CHAT_CONFIG.maxMessageLength} characters.` },
        { status: 400 }
      )
    }

    // Get user memory if exists (Pro feature)
    let userContext = ""
    if (isSubscribed) {
      const { data: memory } = await supabase
        .from("user_memory")
        .select("*")
        .eq("user_id", user.id)
        .single()

      userContext = buildUserContext(
        {
          display_name: profile?.display_name,
          club_name: profile?.club_name,
          age_group: profile?.age_group,
          coaching_level: profile?.coaching_level,
        },
        memory || undefined
      )
    } else {
      userContext = buildUserContext({
        display_name: profile?.display_name,
        club_name: profile?.club_name,
        age_group: profile?.age_group,
        coaching_level: profile?.coaching_level,
      })
    }

    // Build messages array for Claude
    const systemPrompt = SYSTEM_PROMPT + userContext

    // Trim history to last N messages
    const trimmedHistory = history.slice(-CHAT_CONFIG.maxHistoryMessages)

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
            max_tokens: CHAT_CONFIG.maxTokens,
            system: systemPrompt,
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

          // Save conversation and messages to database
          const adminClient = getAdminClient()

          // Create or get conversation
          let convId = conversationId
          if (!convId) {
            // Create new conversation
            const { data: conv, error: convError } = await adminClient
              .from("conversations")
              .insert({
                user_id: user.id,
                title: generateTitle(message),
              })
              .select("id")
              .single()

            if (convError) {
              console.error("Error creating conversation:", convError)
            } else {
              convId = conv.id
            }
          } else {
            // Update conversation timestamp
            await adminClient
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", convId)
          }

          // Save messages
          if (convId) {
            await adminClient.from("messages").insert([
              {
                conversation_id: convId,
                user_id: user.id,
                role: "user",
                content: message,
              },
              {
                conversation_id: convId,
                user_id: user.id,
                role: "assistant",
                content: fullResponse,
              },
            ])
          }

          // Update last_active_at on profile
          await adminClient
            .from("profiles")
            .update({ last_active_at: new Date().toISOString() })
            .eq("user_id", user.id)

          // Calculate remaining messages for free tier
          let remaining = isSubscribed ? -1 : 4 // -1 means unlimited
          if (!isSubscribed) {
            const today = new Date().toISOString().split("T")[0]
            const { count } = await adminClient
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("created_at", `${today}T00:00:00.000Z`)
              .eq("role", "user")

            remaining = Math.max(0, 5 - (count || 0))
          }

          // Send done message with metadata
          const done = JSON.stringify({
            type: "done",
            conversation_id: convId,
            remaining,
            follow_ups: [
              "What else is on your mind?",
              "Would you like to explore this further?",
            ],
          })
          controller.enqueue(encoder.encode(`data: ${done}\n\n`))
          controller.close()

        } catch (error) {
          console.error("Streaming error:", error)
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
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
