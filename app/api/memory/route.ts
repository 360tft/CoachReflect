import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// GET /api/memory - Fetch user's memory/context
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: memory } = await supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({ memory: memory || null })

  } catch (error) {
    console.error("Memory GET error:", error)
    return NextResponse.json({ error: "Failed to fetch memory" }, { status: 500 })
  }
}

// PUT /api/memory - Update user's memory/context
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      coaching_style,
      common_challenges,
      strengths,
      goals,
      player_info,
      team_context,
    } = body

    // Use admin client to upsert
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await adminClient
      .from("user_memory")
      .upsert({
        user_id: user.id,
        coaching_style: coaching_style || [],
        common_challenges: common_challenges || [],
        strengths: strengths || [],
        goals: goals || [],
        player_info: player_info || {},
        team_context: team_context || null,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single()

    if (error) {
      console.error("Memory upsert error:", error)
      return NextResponse.json({ error: "Failed to update memory" }, { status: 500 })
    }

    return NextResponse.json({ memory: data })

  } catch (error) {
    console.error("Memory PUT error:", error)
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 })
  }
}

// POST /api/memory/extract - Extract insights from a conversation to update memory
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Pro user
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single()

    if (profile?.subscription_tier === "free") {
      return NextResponse.json(
        { error: "Memory extraction requires Pro subscription" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { conversation_content } = body

    if (!conversation_content) {
      return NextResponse.json(
        { error: "Conversation content required" },
        { status: 400 }
      )
    }

    // Get current memory
    const { data: currentMemory } = await supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Use Gemini to extract insights
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

    const extractionPrompt = `Analyze this coaching conversation and extract key information about the coach. Return a JSON object with these fields (keep existing values if no new info):

Current memory: ${JSON.stringify(currentMemory || {})}

Conversation:
${conversation_content}

Extract and return JSON with:
- coaching_style: array of style descriptors (e.g., "player-centered", "structured")
- common_challenges: array of recurring issues they face
- strengths: array of things they're good at
- goals: array of what they're working toward
- player_info: object with key player names and notes
- team_context: string describing current team situation

Only add new information that's clearly stated. Don't invent details. Return ONLY valid JSON.`

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(extractionPrompt)
    const response = result.response
    const textContent = response.text()

    if (!textContent) {
      return NextResponse.json({ error: "Failed to extract memory" }, { status: 500 })
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
      console.error("Failed to parse memory extraction:", textContent)
      return NextResponse.json({ error: "Failed to parse extraction" }, { status: 500 })
    }

    // Merge with existing memory
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const mergedMemory = {
      coaching_style: [...new Set([...(currentMemory?.coaching_style || []), ...(extracted.coaching_style || [])])].slice(0, 10),
      common_challenges: [...new Set([...(currentMemory?.common_challenges || []), ...(extracted.common_challenges || [])])].slice(0, 10),
      strengths: [...new Set([...(currentMemory?.strengths || []), ...(extracted.strengths || [])])].slice(0, 10),
      goals: [...new Set([...(currentMemory?.goals || []), ...(extracted.goals || [])])].slice(0, 10),
      player_info: { ...(currentMemory?.player_info || {}), ...(extracted.player_info || {}) },
      team_context: extracted.team_context || currentMemory?.team_context || null,
    }

    const { data, error } = await adminClient
      .from("user_memory")
      .upsert({
        user_id: user.id,
        ...mergedMemory,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single()

    if (error) {
      console.error("Memory update error:", error)
      return NextResponse.json({ error: "Failed to save memory" }, { status: 500 })
    }

    return NextResponse.json({ memory: data, extracted })

  } catch (error) {
    console.error("Memory extraction error:", error)
    return NextResponse.json({ error: "Failed to extract memory" }, { status: 500 })
  }
}
