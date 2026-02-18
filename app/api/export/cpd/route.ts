import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

interface CPDExportData {
  coach_name: string
  coaching_level: string
  club_name: string
  sport: string
  date_range: {
    start: string
    end: string
  }
  summary: {
    total_sessions: number
    total_reflections: number
    total_messages: number
    total_voice_notes: number
    themes_covered: number
    players_tracked: number
  }
  themes: Array<{
    name: string
    count: number
    examples: string[]
  }>
  reflections: Array<{
    date: string
    type: string
    summary: string
    key_learning?: string
  }>
  key_insights: string[]
  generated_at: string
}

// GET /api/export/cpd?start=2026-01-01&end=2026-01-31&format=html
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`cpd-export:${user.id}`, {
      maxRequests: 5,
      windowSeconds: 3600, // 5 per hour
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many export requests. Try again later.", retry_after: rateLimit.resetInSeconds },
        { status: 429 }
      )
    }

    // Check subscription (Pro feature)
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, display_name, coaching_level, club_name, sport")
      .eq("user_id", user.id)
      .single()

    if (profile?.subscription_tier === "free") {
      return NextResponse.json(
        { error: "CPD export is a Pro feature", code: "UPGRADE_REQUIRED" },
        { status: 402 }
      )
    }

    // Parse date range from query params
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("start")
    const endDate = searchParams.get("end")
    const format = searchParams.get("format") || "html"

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start and end dates are required (YYYY-MM-DD)" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const startIso = `${startDate}T00:00:00.000Z`
    const endIso = `${endDate}T23:59:59.999Z`

    // Gather data for the period

    // 1. Count messages
    const { count: messageCount } = await adminClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", startIso)
      .lte("created_at", endIso)

    // 2. Count voice notes
    const { count: voiceNoteCount } = await adminClient
      .from("message_attachments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("attachment_type", "voice")
      .gte("created_at", startIso)
      .lte("created_at", endIso)

    // 3. Get extracted insights
    const { data: insights } = await adminClient
      .from("extracted_insights")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false })

    // Aggregate themes
    const themeMap = new Map<string, { count: number; examples: string[] }>()
    const playerSet = new Set<string>()

    insights?.forEach(insight => {
      // Players
      const players = insight.players_mentioned as Array<{ name: string }> || []
      players.forEach(p => playerSet.add(p.name.toLowerCase()))

      // Themes
      const themes = insight.themes as Array<{ theme_id: string }> || []
      themes.forEach(t => {
        const existing = themeMap.get(t.theme_id) || { count: 0, examples: [] }
        existing.count++
        themeMap.set(t.theme_id, existing)
      })

      // Challenges as examples
      const challenges = insight.challenges_noted as string[] || []
      challenges.forEach(c => {
        const themes = insight.themes as Array<{ theme_id: string }> || []
        if (themes.length > 0) {
          const mainTheme = themes[0].theme_id
          const existing = themeMap.get(mainTheme) || { count: 0, examples: [] }
          if (existing.examples.length < 3) {
            existing.examples.push(c)
          }
          themeMap.set(mainTheme, existing)
        }
      })
    })

    // Get theme names
    const themeIds = Array.from(themeMap.keys())
    let themeNames = new Map<string, string>()
    if (themeIds.length > 0) {
      const { data: themeData } = await adminClient
        .from("coaching_themes")
        .select("id, name")
        .in("id", themeIds)
      themeNames = new Map(themeData?.map(t => [t.id, t.name]) || [])
    }

    // Build reflections summary
    const reflections = (insights || []).slice(0, 20).map(insight => ({
      date: insight.session_date || insight.created_at.split('T')[0],
      type: 'Reflection',
      summary: `Session reflection covering ${
        (insight.themes as Array<{ theme_id: string }>)?.length || 0
      } coaching themes. ${
        (insight.players_mentioned as Array<{ name: string }>)?.length || 0
      } players mentioned.`,
      key_learning: (insight.challenges_noted as string[] || [])[0] || undefined,
    }))

    // Generate key insights
    const keyInsights: string[] = []

    if (themeMap.size > 0) {
      const topTheme = Array.from(themeMap.entries())
        .sort((a, b) => b[1].count - a[1].count)[0]
      keyInsights.push(`Most frequent coaching focus: "${themeNames.get(topTheme[0]) || topTheme[0]}" (${topTheme[1].count} times)`)
    }

    if (playerSet.size > 0) {
      keyInsights.push(`Tracked ${playerSet.size} individual player${playerSet.size !== 1 ? 's' : ''} across sessions`)
    }

    if ((insights?.length || 0) > 0) {
      keyInsights.push(`Completed ${insights?.length || 0} structured reflections in this period`)
    }

    // Build export data
    const exportData: CPDExportData = {
      coach_name: profile?.display_name || user.email?.split("@")[0] || "Coach",
      coaching_level: profile?.coaching_level || "Not specified",
      club_name: profile?.club_name || "Not specified",
      sport: profile?.sport || "football",
      date_range: {
        start: startDate,
        end: endDate,
      },
      summary: {
        total_sessions: insights?.length || 0,
        total_reflections: insights?.length || 0,
        total_messages: messageCount || 0,
        total_voice_notes: voiceNoteCount || 0,
        themes_covered: themeMap.size,
        players_tracked: playerSet.size,
      },
      themes: Array.from(themeMap.entries())
        .map(([id, data]) => ({
          name: themeNames.get(id) || id.replace(/_/g, ' '),
          count: data.count,
          examples: data.examples,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      reflections,
      key_insights: keyInsights,
      generated_at: new Date().toISOString(),
    }

    // Log the export
    await adminClient.from("cpd_exports").insert({
      user_id: user.id,
      date_range_start: startDate,
      date_range_end: endDate,
      total_sessions: exportData.summary.total_sessions,
      total_reflections: exportData.summary.total_reflections,
      themes_covered: exportData.themes.map(t => t.name),
      insights_generated: exportData.key_insights.length,
    })

    // Return based on format
    if (format === "json") {
      return NextResponse.json(exportData)
    }

    // Return HTML for printing to PDF
    const html = generateCPDHtml(exportData)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="cpd-report-${startDate}-to-${endDate}.html"`,
      },
    })

  } catch (error) {
    console.error("CPD export error:", error)
    return NextResponse.json(
      { error: "Failed to generate CPD export" },
      { status: 500 }
    )
  }
}

function generateCPDHtml(data: CPDExportData): string {
  const sportName = data.sport.charAt(0).toUpperCase() + data.sport.slice(1)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CPD Record - ${data.coach_name}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #E5A11C;
    }
    .header h1 {
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .header .subtitle {
      color: #666;
      font-size: 16px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 16px;
      font-weight: 500;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 18px;
      color: #1a1a1a;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-item {
      text-align: center;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .summary-number {
      font-size: 32px;
      font-weight: bold;
      color: #E5A11C;
    }
    .summary-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .theme-list {
      list-style: none;
    }
    .theme-item {
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .theme-name {
      font-weight: 500;
      display: flex;
      justify-content: space-between;
    }
    .theme-count {
      color: #888;
      font-size: 14px;
    }
    .theme-examples {
      margin-top: 8px;
      padding-left: 15px;
      font-size: 14px;
      color: #666;
    }
    .insights-list {
      list-style: none;
    }
    .insight-item {
      padding: 12px;
      background: #fef3c7;
      border-left: 4px solid #E5A11C;
      margin-bottom: 10px;
      border-radius: 0 8px 8px 0;
    }
    .reflection-item {
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .reflection-date {
      font-size: 12px;
      color: #888;
      margin-bottom: 4px;
    }
    .reflection-summary {
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    .signature-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
    }
    .signature-box {
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
    .signature-label {
      font-size: 12px;
      color: #888;
    }
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Continuing Professional Development Record</h1>
    <p class="subtitle">${sportName} Coaching - ${data.date_range.start} to ${data.date_range.end}</p>
  </div>

  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Coach Name</span>
      <span class="meta-value">${data.coach_name}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Coaching Level</span>
      <span class="meta-value">${data.coaching_level}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Club/Organization</span>
      <span class="meta-value">${data.club_name}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Sport</span>
      <span class="meta-value">${sportName}</span>
    </div>
  </div>

  <div class="section">
    <h2>Activity Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-number">${data.summary.total_reflections}</div>
        <div class="summary-label">Reflections</div>
      </div>
      <div class="summary-item">
        <div class="summary-number">${data.summary.themes_covered}</div>
        <div class="summary-label">Coaching Themes</div>
      </div>
      <div class="summary-item">
        <div class="summary-number">${data.summary.players_tracked}</div>
        <div class="summary-label">Players Tracked</div>
      </div>
    </div>
  </div>

  ${data.key_insights.length > 0 ? `
  <div class="section">
    <h2>Key Insights</h2>
    <ul class="insights-list">
      ${data.key_insights.map(insight => `
        <li class="insight-item">${insight}</li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${data.themes.length > 0 ? `
  <div class="section">
    <h2>Coaching Themes Covered</h2>
    <ul class="theme-list">
      ${data.themes.map(theme => `
        <li class="theme-item">
          <div class="theme-name">
            <span>${theme.name}</span>
            <span class="theme-count">${theme.count} session${theme.count !== 1 ? 's' : ''}</span>
          </div>
          ${theme.examples.length > 0 ? `
            <ul class="theme-examples">
              ${theme.examples.map(ex => `<li>${ex}</li>`).join('')}
            </ul>
          ` : ''}
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${data.reflections.length > 0 ? `
  <div class="section">
    <h2>Reflection Log</h2>
    ${data.reflections.slice(0, 10).map(reflection => `
      <div class="reflection-item">
        <div class="reflection-date">${new Date(reflection.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div class="reflection-summary">${reflection.summary}</div>
        ${reflection.key_learning ? `<p style="margin-top: 8px; font-style: italic; color: #666;">Learning: ${reflection.key_learning}</p>` : ''}
      </div>
    `).join('')}
    ${data.reflections.length > 10 ? `<p style="color: #888; font-size: 14px;">+ ${data.reflections.length - 10} more reflections in this period</p>` : ''}
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <p class="signature-label">Coach Signature & Date</p>
    </div>
    <div class="signature-box">
      <p class="signature-label">Verifier Signature & Date (if applicable)</p>
    </div>
  </div>

  <div class="footer">
    <p>Generated by CoachReflection on ${new Date(data.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <p>This document is intended for coaching license CPD documentation purposes.</p>
    <p style="margin-top: 10px;">CoachReflection - Part of the 360TFT family of coaching tools</p>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
    <p style="margin-bottom: 10px;">To save as PDF, use your browser's Print function (Ctrl/Cmd + P) and select "Save as PDF"</p>
    <button onclick="window.print()" style="background: #E5A11C; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
`
}
