import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import {
  getSearchConsoleData,
  getAnalyticsData,
  getLowCTROpportunities,
  getFirstPageOpportunities,
  generateSEOInsights,
  type SearchConsoleData,
  type AnalyticsData,
  type SearchConsoleQuery,
  type SearchConsolePage,
  type AnalyticsSourceData,
  type SEOInsight,
} from "@/lib/google-apis"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CoachReflection <hello@send.coachreflection.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

// GET /api/cron/seo-report
// Runs every Monday at 7 AM UTC - sends SEO/analytics report to admin
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check for Resend
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return NextResponse.json({ message: "Skipped: Missing Resend API key" }, { status: 200 })
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()).filter(Boolean)
  if (!adminEmails || adminEmails.length === 0) {
    return NextResponse.json({ message: "Skipped: No ADMIN_EMAILS configured" }, { status: 200 })
  }

  // Check for Google API credentials
  const hasGoogleCreds = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
  if (!hasGoogleCreds) {
    return NextResponse.json({ message: "Skipped: Google API credentials not configured" }, { status: 200 })
  }

  // Fetch all data, handling failures gracefully
  let currentGSC: SearchConsoleData | null = null
  let previousGSC: SearchConsoleData | null = null
  let analytics: AnalyticsData | null = null
  let lowCTR: SearchConsoleQuery[] = []
  let firstPageOpps: SearchConsoleQuery[] = []
  let insights: SEOInsight[] = []

  try {
    currentGSC = await getSearchConsoleData(7)
  } catch (error) {
    console.error("[SEO Report] Failed to fetch current GSC data:", error)
  }

  try {
    previousGSC = await getSearchConsoleData(14)
  } catch (error) {
    console.error("[SEO Report] Failed to fetch previous GSC data:", error)
  }

  try {
    analytics = await getAnalyticsData(7)
  } catch (error) {
    console.error("[SEO Report] Failed to fetch analytics data:", error)
  }

  try {
    lowCTR = await getLowCTROpportunities()
  } catch (error) {
    console.error("[SEO Report] Failed to fetch low CTR opportunities:", error)
  }

  try {
    firstPageOpps = await getFirstPageOpportunities()
  } catch (error) {
    console.error("[SEO Report] Failed to fetch first page opportunities:", error)
  }

  try {
    insights = await generateSEOInsights()
  } catch (error) {
    console.error("[SEO Report] Failed to generate insights:", error)
  }

  // Calculate week-over-week deltas for GSC
  // previousGSC covers 14 days; to get "previous 7 days" we subtract current from the 14-day totals
  let prevTotals: { clicks: number; impressions: number; ctr: number; position: number } | null = null
  if (currentGSC && previousGSC) {
    prevTotals = {
      clicks: previousGSC.totals.clicks - currentGSC.totals.clicks,
      impressions: previousGSC.totals.impressions - currentGSC.totals.impressions,
      ctr: previousGSC.totals.ctr, // Use the 14-day avg as approximation
      position: previousGSC.totals.position,
    }
  }

  // Build the email HTML
  const html = buildEmailHTML({
    currentGSC,
    prevTotals,
    analytics,
    lowCTR: lowCTR.slice(0, 3),
    firstPageOpps: firstPageOpps.slice(0, 3),
    insights: insights.filter(i => i.priority === 'high' || i.priority === 'medium'),
  })

  // Send email
  const resend = new Resend(resendApiKey)
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmails,
      subject: `SEO Report - ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      html,
    })
  } catch (error) {
    console.error("[SEO Report] Failed to send email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }

  // Log to email_log if Supabase is available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      await supabase.from("email_log").insert({
        email_type: "seo_report",
        subject: "Weekly SEO Report",
        sent_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[SEO Report] Failed to log email:", error)
    }
  }

  return NextResponse.json({
    sent: true,
    recipients: adminEmails,
    sections: {
      searchConsole: !!currentGSC,
      analytics: !!analytics,
      opportunities: lowCTR.length + firstPageOpps.length,
      insights: insights.length,
    },
  })
}

// ============================================================
// EMAIL HTML BUILDER
// ============================================================

interface EmailData {
  currentGSC: SearchConsoleData | null
  prevTotals: { clicks: number; impressions: number; ctr: number; position: number } | null
  analytics: AnalyticsData | null
  lowCTR: SearchConsoleQuery[]
  firstPageOpps: SearchConsoleQuery[]
  insights: SEOInsight[]
}

function buildEmailHTML(data: EmailData): string {
  const { currentGSC, prevTotals, analytics, lowCTR, firstPageOpps, insights } = data

  const weekEnd = new Date()
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  const dateRange = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
<div style="max-width: 640px; margin: 0 auto; padding: 24px;">

  <!-- Header -->
  <div style="background-color: #E5A11C; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Weekly SEO Report</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">${dateRange}</p>
  </div>

  <div style="background-color: #ffffff; border-radius: 0 0 12px 12px; padding: 24px;">

    ${currentGSC ? buildSearchConsoleSection(currentGSC, prevTotals) : buildNoDataSection('Search Console')}

    ${currentGSC ? buildTopQueriesSection(currentGSC.queries.slice(0, 5)) : ''}

    ${currentGSC ? buildTopPagesSection(currentGSC.pages.slice(0, 5)) : ''}

    ${analytics ? buildAnalyticsSection(analytics) : buildNoDataSection('Google Analytics')}

    ${analytics && analytics.topSources.length > 0 ? buildTopSourcesSection(analytics.topSources.slice(0, 3)) : ''}

    ${lowCTR.length > 0 || firstPageOpps.length > 0 ? buildOpportunitiesSection(lowCTR, firstPageOpps) : ''}

    ${insights.length > 0 ? buildInsightsSection(insights) : ''}

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px; text-align: center;">
      <a href="${APP_URL}/app/admin/seo" style="display: inline-block; background-color: #E5A11C; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">View Full SEO Dashboard</a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">CoachReflection - Automated weekly report</p>
    </div>

  </div>
</div>
</body>
</html>`
}

function formatDelta(current: number, previous: number, isPercentage = false, invertBetter = false): string {
  const diff = current - previous
  if (previous === 0 || diff === 0) return ''
  const pctChange = previous !== 0 ? ((diff / previous) * 100) : 0
  const isPositive = invertBetter ? diff < 0 : diff > 0
  const color = isPositive ? '#16a34a' : '#dc2626'
  const arrow = diff > 0 ? '&#9650;' : '&#9660;'
  const formattedDiff = isPercentage
    ? `${diff > 0 ? '+' : ''}${(diff * 100).toFixed(1)}pp`
    : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}`
  return `<span style="color: ${color}; font-size: 12px; margin-left: 4px;">${arrow} ${formattedDiff} (${pctChange > 0 ? '+' : ''}${pctChange.toFixed(0)}%)</span>`
}

function buildSearchConsoleSection(gsc: SearchConsoleData, prev: { clicks: number; impressions: number; ctr: number; position: number } | null): string {
  const clicksDelta = prev ? formatDelta(gsc.totals.clicks, prev.clicks) : ''
  const impressionsDelta = prev ? formatDelta(gsc.totals.impressions, prev.impressions) : ''
  const ctrDelta = prev ? formatDelta(gsc.totals.ctr, prev.ctr, true) : ''
  const positionDelta = prev ? formatDelta(gsc.totals.position, prev.position, false, true) : ''

  return `
    <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5A11C;">Search Console Overview</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${gsc.totals.clicks.toLocaleString()}</div>
          <div style="font-size: 12px; color: #6b7280;">Clicks ${clicksDelta}</div>
        </td>
        <td style="padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${gsc.totals.impressions.toLocaleString()}</div>
          <div style="font-size: 12px; color: #6b7280;">Impressions ${impressionsDelta}</div>
        </td>
        <td style="padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${(gsc.totals.ctr * 100).toFixed(1)}%</div>
          <div style="font-size: 12px; color: #6b7280;">Avg CTR ${ctrDelta}</div>
        </td>
        <td style="padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${gsc.totals.position.toFixed(1)}</div>
          <div style="font-size: 12px; color: #6b7280;">Avg Position ${positionDelta}</div>
        </td>
      </tr>
    </table>`
}

function buildTopQueriesSection(queries: SearchConsoleQuery[]): string {
  if (queries.length === 0) return ''

  const rows = queries.map(q => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151;">${escapeHtml(q.query)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #1f2937; font-weight: bold;">${q.clicks}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #6b7280;">${q.impressions.toLocaleString()}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #6b7280;">${(q.ctr * 100).toFixed(1)}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #6b7280;">${q.position.toFixed(1)}</td>
    </tr>`).join('')

  return `
    <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5A11C;">Top 5 Queries</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Query</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Clicks</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Impr</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">CTR</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Pos</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function buildTopPagesSection(pages: SearchConsolePage[]): string {
  if (pages.length === 0) return ''

  const rows = pages.map(p => {
    // Trim to just the path
    let path = p.page
    try {
      const url = new URL(p.page)
      path = url.pathname || '/'
    } catch {
      // Keep original if not a valid URL
    }

    return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(path)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #1f2937; font-weight: bold;">${p.clicks}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #6b7280;">${p.impressions.toLocaleString()}</td>
    </tr>`
  }).join('')

  return `
    <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5A11C;">Top 5 Pages</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Page</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Clicks</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Impr</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function buildAnalyticsSection(analytics: AnalyticsData): string {
  const { overview } = analytics
  const duration = overview.avgSessionDuration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return `
    <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5A11C;">Analytics Overview</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 10px; text-align: center; width: 33%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${overview.users.toLocaleString()}</div>
          <div style="font-size: 12px; color: #6b7280;">Users</div>
        </td>
        <td style="padding: 10px; text-align: center; width: 33%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${overview.sessions.toLocaleString()}</div>
          <div style="font-size: 12px; color: #6b7280;">Sessions</div>
        </td>
        <td style="padding: 10px; text-align: center; width: 33%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${overview.pageviews.toLocaleString()}</div>
          <div style="font-size: 12px; color: #6b7280;">Pageviews</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px; text-align: center; width: 33%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${(overview.bounceRate * 100).toFixed(1)}%</div>
          <div style="font-size: 12px; color: #6b7280;">Bounce Rate</div>
        </td>
        <td style="padding: 10px; text-align: center; width: 33%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${durationStr}</div>
          <div style="font-size: 12px; color: #6b7280;">Avg Session</div>
        </td>
        <td style="padding: 10px; text-align: center; width: 33%;">
          <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${overview.newUsers.toLocaleString()}</div>
          <div style="font-size: 12px; color: #6b7280;">New Users</div>
        </td>
      </tr>
    </table>`
}

function buildTopSourcesSection(sources: AnalyticsSourceData[]): string {
  const rows = sources.map(s => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151;">${escapeHtml(s.source)} / ${escapeHtml(s.medium)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #1f2937; font-weight: bold;">${s.users}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: #6b7280;">${s.sessions}</td>
    </tr>`).join('')

  return `
    <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5A11C;">Top Traffic Sources</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Source / Medium</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Users</th>
          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Sessions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function buildOpportunitiesSection(lowCTR: SearchConsoleQuery[], firstPageOpps: SearchConsoleQuery[]): string {
  let html = `<h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5A11C;">SEO Opportunities</h2>`

  if (lowCTR.length > 0) {
    html += `<h3 style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">Low CTR (high impressions, low clicks)</h3>`
    html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">`
    html += `<thead><tr style="background-color: #fef3c7;">
      <th style="padding: 6px 8px; text-align: left; font-size: 11px; color: #92400e; text-transform: uppercase;">Query</th>
      <th style="padding: 6px 8px; text-align: right; font-size: 11px; color: #92400e; text-transform: uppercase;">Impr</th>
      <th style="padding: 6px 8px; text-align: right; font-size: 11px; color: #92400e; text-transform: uppercase;">CTR</th>
    </tr></thead><tbody>`
    lowCTR.forEach(q => {
      html += `<tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px;">${escapeHtml(q.query)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right;">${q.impressions.toLocaleString()}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right;">${(q.ctr * 100).toFixed(1)}%</td>
      </tr>`
    })
    html += `</tbody></table>`
  }

  if (firstPageOpps.length > 0) {
    html += `<h3 style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">Close to Top 3 (position 4-20)</h3>`
    html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">`
    html += `<thead><tr style="background-color: #fef3c7;">
      <th style="padding: 6px 8px; text-align: left; font-size: 11px; color: #92400e; text-transform: uppercase;">Query</th>
      <th style="padding: 6px 8px; text-align: right; font-size: 11px; color: #92400e; text-transform: uppercase;">Position</th>
      <th style="padding: 6px 8px; text-align: right; font-size: 11px; color: #92400e; text-transform: uppercase;">Clicks</th>
    </tr></thead><tbody>`
    firstPageOpps.forEach(q => {
      html += `<tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px;">${escapeHtml(q.query)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right;">${q.position.toFixed(1)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right;">${q.clicks}</td>
      </tr>`
    })
    html += `</tbody></table>`
  }

  return html
}

function buildInsightsSection(insights: SEOInsight[]): string {
  const items = insights.map(insight => {
    const icon = insight.type === 'opportunity' ? '&#128161;' : insight.type === 'issue' ? '&#9888;&#65039;' : '&#9989;'
    const bgColor = insight.priority === 'high' ? '#fef2f2' : '#fefce8'
    const borderColor = insight.priority === 'high' ? '#fca5a5' : '#fde68a'

    return `
      <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
        <div style="font-size: 14px; font-weight: bold; color: #1f2937;">${icon} ${escapeHtml(insight.title)}</div>
        <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">${escapeHtml(insight.description)}</div>
        ${insight.action ? `<div style="font-size: 12px; color: #E5A11C; margin-top: 4px; font-weight: bold;">Action: ${escapeHtml(insight.action)}</div>` : ''}
      </div>`
  }).join('')

  return `
    <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5A11C;">SEO Insights</h2>
    ${items}`
}

function buildNoDataSection(name: string): string {
  return `
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">${name} data unavailable. Check API credentials.</p>
    </div>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

