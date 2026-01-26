import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getSystemPrompt, getReflectionSystemPrompt, isReflectionStart, CHAT_CONFIG, buildUserContext } from "@/lib/chat-config"
import type { ChatMessage, SessionPlanAnalysis } from "@/app/types"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

// Extract memory from conversation (runs async, non-blocking)
async function extractMemoryFromConversation(
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    const adminClient = createAdminClient()

    // Get current memory
    const { data: currentMemory } = await adminClient
      .from("user_memory")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Build conversation content
    const conversationContent = `User: ${userMessage}\n\nAssistant: ${assistantResponse}`

    // Use Gemini to extract insights
    const extractionPrompt = `Analyze this coaching conversation and extract key information about the coach. Return a JSON object with these fields (keep existing values if no new info):

Current memory: ${JSON.stringify(currentMemory || {})}

Conversation:
${conversationContent}

Extract and return JSON with:
- coaching_style: array of style descriptors (e.g., "player-centered", "structured")
- common_challenges: array of recurring issues they face
- strengths: array of things they're good at
- goals: array of what they're working toward
- player_info: object with key player names and notes
- team_context: string describing current team situation

Only add new information that's clearly stated. Don't invent details. If nothing new to add, return empty arrays/objects for those fields. Return ONLY valid JSON.`

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(extractionPrompt)
    const response = result.response
    const textContent = response.text()

    if (!textContent) {
      return
    }

    // Parse extracted memory
    let extracted
    try {
      let jsonText = textContent.trim()
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
      if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
      if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
      extracted = JSON.parse(jsonText.trim())
    } catch {
      console.error("Failed to parse memory extraction")
      return
    }

    // Only update if there's new meaningful content
    const hasNewContent =
      (extracted.coaching_style?.length > 0) ||
      (extracted.common_challenges?.length > 0) ||
      (extracted.strengths?.length > 0) ||
      (extracted.goals?.length > 0) ||
      (Object.keys(extracted.player_info || {}).length > 0) ||
      extracted.team_context

    if (!hasNewContent) {
      return
    }

    // Merge with existing memory
    const mergedMemory = {
      coaching_style: [...new Set([...(currentMemory?.coaching_style || []), ...(extracted.coaching_style || [])])].slice(0, 10),
      common_challenges: [...new Set([...(currentMemory?.common_challenges || []), ...(extracted.common_challenges || [])])].slice(0, 10),
      strengths: [...new Set([...(currentMemory?.strengths || []), ...(extracted.strengths || [])])].slice(0, 10),
      goals: [...new Set([...(currentMemory?.goals || []), ...(extracted.goals || [])])].slice(0, 10),
      player_info: { ...(currentMemory?.player_info || {}), ...(extracted.player_info || {}) },
      team_context: extracted.team_context || currentMemory?.team_context || null,
    }

    // Upsert memory
    await adminClient
      .from("user_memory")
      .upsert({
        user_id: userId,
        ...mergedMemory,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })

  } catch (error) {
    console.error("Memory extraction error:", error)
  }
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

    // Rate limiting
    const rateLimit = await checkRateLimit(`chat:${user.id}`, RATE_LIMITS.CHAT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before sending another message.", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
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
      conversationId,
      attachments = []
    }: {
      message: string
      history: ChatMessage[]
      conversationId?: string
      attachments?: {
        type: 'voice' | 'image'
        attachment_id: string
        transcription?: string
        analysis?: SessionPlanAnalysis
        file_url?: string
      }[]
    } = body

    // Validate message or attachments
    if ((!message || typeof message !== "string") && attachments.length === 0) {
      return NextResponse.json(
        { error: "Message or attachment is required" },
        { status: 400 }
      )
    }

    // Build message with attachment context
    let fullMessage = message || ""

    // Add voice transcriptions to the message context
    const voiceTranscriptions = attachments
      .filter(a => a.type === 'voice' && a.transcription)
      .map(a => a.transcription)
      .join('\n\n')

    if (voiceTranscriptions) {
      if (fullMessage) {
        fullMessage = `${fullMessage}\n\n[Voice note transcription]\n${voiceTranscriptions}`
      } else {
        fullMessage = `[Voice note transcription]\n${voiceTranscriptions}`
      }
    }

    // Add session plan analysis to the message context
    const imageAttachments = attachments.filter(a => a.type === 'image' && a.analysis)
    if (imageAttachments.length > 0) {
      const sessionPlanContext = imageAttachments.map(a => {
        const analysis = a.analysis!
        const parts: string[] = []

        if (analysis.title) parts.push(`Title: ${analysis.title}`)
        if (analysis.objectives?.length) parts.push(`Objectives: ${analysis.objectives.join(', ')}`)
        if (analysis.drills?.length) {
          const drillSummary = analysis.drills.map(d => {
            let drill = d.name
            if (d.duration_minutes) drill += ` (${d.duration_minutes}min)`
            return drill
          }).join(', ')
          parts.push(`Drills: ${drillSummary}`)
        }
        if (analysis.total_duration_minutes) parts.push(`Total Duration: ${analysis.total_duration_minutes} minutes`)
        if (analysis.coaching_points?.length) parts.push(`Key Coaching Points: ${analysis.coaching_points.join(', ')}`)
        if (analysis.equipment_needed?.length) parts.push(`Equipment: ${analysis.equipment_needed.join(', ')}`)

        return parts.join('\n')
      }).join('\n\n---\n\n')

      const sessionPlanSection = `[Session Plan Analysis]\n${sessionPlanContext}`

      if (fullMessage) {
        fullMessage = `${fullMessage}\n\n${sessionPlanSection}`
      } else {
        fullMessage = sessionPlanSection
      }
    }

    // Validate the final message
    if (!fullMessage.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    if (fullMessage.length > CHAT_CONFIG.maxMessageLength) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${CHAT_CONFIG.maxMessageLength} characters.` },
        { status: 400 }
      )
    }

    // Get user's sport (default to football)
    const userSport = profile?.sport || 'football'

    // Get user memory if exists (Pro feature)
    let userContext = ""
    let syllabusContext = ""

    if (isSubscribed) {
      const adminClient = createAdminClient()

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
          sport: userSport,
        },
        memory || undefined
      )

      // Fetch syllabus (personal or club) for Pro+ users
      // Check for personal syllabus first
      const { data: personalSyllabus } = await adminClient
        .from('syllabi')
        .select('title, extracted_text, processing_status')
        .eq('user_id', user.id)
        .is('club_id', null)
        .single()

      if (personalSyllabus?.extracted_text && personalSyllabus.processing_status === 'completed') {
        syllabusContext = `\n\n[Coach's Syllabus: "${personalSyllabus.title}"]\n${personalSyllabus.extracted_text}`
      } else {
        // Check for club syllabus
        const { data: membership } = await adminClient
          .from('club_members')
          .select('club_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (membership?.club_id) {
          const { data: clubSyllabus } = await adminClient
            .from('syllabi')
            .select('title, extracted_text, processing_status')
            .eq('club_id', membership.club_id)
            .single()

          if (clubSyllabus?.extracted_text && clubSyllabus.processing_status === 'completed') {
            syllabusContext = `\n\n[Club Syllabus: "${clubSyllabus.title}"]\n${clubSyllabus.extracted_text}`
          }
        }
      }
    } else {
      userContext = buildUserContext({
        display_name: profile?.display_name,
        club_name: profile?.club_name,
        age_group: profile?.age_group,
        coaching_level: profile?.coaching_level,
        sport: userSport,
      })
    }

    // Detect if this is a reflection (has attachments or reflection keywords)
    const hasVoiceAttachment = attachments.some(a => a.type === 'voice' && a.transcription)
    const hasImageAttachment = attachments.some(a => a.type === 'image' && a.analysis)
    const isReflection = isReflectionStart(message || '', hasVoiceAttachment, hasImageAttachment)

    // Build messages array for Gemini with appropriate system prompt
    // Use reflection prompt for reflection flows, regular prompt otherwise
    const basePrompt = isReflection
      ? getReflectionSystemPrompt(userSport)
      : getSystemPrompt(userSport)
    const systemPrompt = basePrompt + userContext + syllabusContext

    // Trim history to last N messages
    const trimmedHistory = history.slice(-CHAT_CONFIG.maxHistoryMessages)

    // Convert history to Gemini format
    const geminiHistory = trimmedHistory.map((msg) => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.content }],
    }))

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullResponse = ""

        try {
          // Create Gemini model with system instruction
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
          })

          // Start chat with history
          const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
              maxOutputTokens: CHAT_CONFIG.maxTokens,
            },
          })

          // Send message with streaming
          const result = await chat.sendMessageStream(fullMessage)

          // Process stream
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              fullResponse += text

              // Send chunk via SSE
              const chunkData = JSON.stringify({
                type: "chunk",
                content: text,
              })
              controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`))
            }
          }

          // Save conversation and messages to database
          const adminClient = createAdminClient()

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
            const { data: savedMessages } = await adminClient.from("messages").insert([
              {
                conversation_id: convId,
                user_id: user.id,
                role: "user",
                content: fullMessage,
              },
              {
                conversation_id: convId,
                user_id: user.id,
                role: "assistant",
                content: fullResponse,
              },
            ]).select('id')

            // Link attachments to the user message
            if (attachments.length > 0 && savedMessages?.[0]?.id) {
              const attachmentIds = attachments.map(a => a.attachment_id)
              await adminClient
                .from("message_attachments")
                .update({ message_id: savedMessages[0].id })
                .in("id", attachmentIds)
                .eq("user_id", user.id)
            }
          }

          // Update last_active_at on profile
          await adminClient
            .from("profiles")
            .update({ last_active_at: new Date().toISOString() })
            .eq("user_id", user.id)

          // Extract memory from conversation for Pro users (non-blocking)
          if (isSubscribed) {
            extractMemoryFromConversation(user.id, message, fullResponse)
              .catch(err => console.error("Background memory extraction failed:", err))
          }

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
