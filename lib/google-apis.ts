/**
 * Google APIs Integration
 * Provides authenticated access to Google Search Console and Google Analytics
 */

import { searchconsole as SearchConsoleAPI } from '@googleapis/searchconsole'
import { analyticsdata as AnalyticsDataAPI } from '@googleapis/analyticsdata'
import { GoogleAuth } from 'google-auth-library'

// Initialize auth with service account credentials
function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google API credentials not configured')
  }

  return new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ],
  })
}

// ============================================================
// GOOGLE SEARCH CONSOLE
// ============================================================

export interface SearchConsoleQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsolePage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleData {
  queries: SearchConsoleQuery[]
  pages: SearchConsolePage[]
  totals: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  dateRange: {
    startDate: string
    endDate: string
  }
}

export async function getSearchConsoleData(days = 28): Promise<SearchConsoleData> {
  const auth = getAuth()
  const searchconsole = SearchConsoleAPI({ version: 'v1', auth })

  const siteUrl = process.env.GSC_SITE_URL || 'https://coachreflection.com'

  // Calculate date range
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 2) // GSC data has 2-day delay
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - days)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  // Fetch top queries
  const queriesResponse = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['query'],
      rowLimit: 50,
      dimensionFilterGroups: [],
    },
  })

  // Fetch top pages
  const pagesResponse = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['page'],
      rowLimit: 50,
    },
  })

  // Parse queries
  const queries: SearchConsoleQuery[] = (queriesResponse.data.rows || []).map(row => ({
    query: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }))

  // Parse pages
  const pages: SearchConsolePage[] = (pagesResponse.data.rows || []).map(row => ({
    page: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }))

  // Calculate totals
  const totals = {
    clicks: queries.reduce((sum, q) => sum + q.clicks, 0),
    impressions: queries.reduce((sum, q) => sum + q.impressions, 0),
    ctr: queries.length > 0
      ? queries.reduce((sum, q) => sum + q.ctr, 0) / queries.length
      : 0,
    position: queries.length > 0
      ? queries.reduce((sum, q) => sum + q.position, 0) / queries.length
      : 0,
  }

  return {
    queries,
    pages,
    totals,
    dateRange: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
  }
}

// Get queries with high impressions but low CTR (optimization opportunities)
export async function getLowCTROpportunities(minImpressions = 100, maxCTR = 0.02): Promise<SearchConsoleQuery[]> {
  const data = await getSearchConsoleData(28)

  return data.queries
    .filter(q => q.impressions >= minImpressions && q.ctr < maxCTR)
    .sort((a, b) => b.impressions - a.impressions)
}

// Get queries ranking 4-20 (first page opportunities)
export async function getFirstPageOpportunities(): Promise<SearchConsoleQuery[]> {
  const data = await getSearchConsoleData(28)

  return data.queries
    .filter(q => q.position >= 4 && q.position <= 20 && q.impressions > 50)
    .sort((a, b) => a.position - b.position)
}

// ============================================================
// GOOGLE ANALYTICS 4
// ============================================================

export interface AnalyticsOverview {
  users: number
  sessions: number
  pageviews: number
  avgSessionDuration: number
  bounceRate: number
  newUsers: number
}

export interface AnalyticsPageData {
  path: string
  pageviews: number
  users: number
  avgEngagementTime: number
}

export interface AnalyticsSourceData {
  source: string
  medium: string
  users: number
  sessions: number
  conversions: number
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  topPages: AnalyticsPageData[]
  topSources: AnalyticsSourceData[]
  dateRange: {
    startDate: string
    endDate: string
  }
}

export async function getAnalyticsData(days = 28): Promise<AnalyticsData> {
  const auth = getAuth()
  const analyticsdata = AnalyticsDataAPI({ version: 'v1beta', auth })

  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID not configured')
  }

  const startDate = `${days}daysAgo`
  const endDate = 'today'

  // Fetch overview metrics
  const overviewResponse = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'newUsers' },
      ],
    },
  })

  // Fetch top pages
  const pagesResponse = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
      ],
      limit: '20',
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    },
  })

  // Fetch traffic sources
  const sourcesResponse = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'conversions' },
      ],
      limit: '15',
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  })

  // Parse overview
  const overviewRow = overviewResponse.data.rows?.[0]
  const overview: AnalyticsOverview = {
    users: parseInt(overviewRow?.metricValues?.[0]?.value || '0'),
    sessions: parseInt(overviewRow?.metricValues?.[1]?.value || '0'),
    pageviews: parseInt(overviewRow?.metricValues?.[2]?.value || '0'),
    avgSessionDuration: parseFloat(overviewRow?.metricValues?.[3]?.value || '0'),
    bounceRate: parseFloat(overviewRow?.metricValues?.[4]?.value || '0'),
    newUsers: parseInt(overviewRow?.metricValues?.[5]?.value || '0'),
  }

  // Parse pages
  const topPages: AnalyticsPageData[] = (pagesResponse.data.rows || []).map(row => ({
    path: row.dimensionValues?.[0]?.value || '',
    pageviews: parseInt(row.metricValues?.[0]?.value || '0'),
    users: parseInt(row.metricValues?.[1]?.value || '0'),
    avgEngagementTime: parseFloat(row.metricValues?.[2]?.value || '0'),
  }))

  // Parse sources
  const topSources: AnalyticsSourceData[] = (sourcesResponse.data.rows || []).map(row => ({
    source: row.dimensionValues?.[0]?.value || '',
    medium: row.dimensionValues?.[1]?.value || '',
    users: parseInt(row.metricValues?.[0]?.value || '0'),
    sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    conversions: parseInt(row.metricValues?.[2]?.value || '0'),
  }))

  return {
    overview,
    topPages,
    topSources,
    dateRange: { startDate, endDate },
  }
}

// ============================================================
// SEO INSIGHTS & RECOMMENDATIONS
// ============================================================

export interface SEOInsight {
  type: 'opportunity' | 'issue' | 'success'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
  data?: Record<string, unknown>
}

export async function generateSEOInsights(): Promise<SEOInsight[]> {
  const insights: SEOInsight[] = []

  try {
    const gscData = await getSearchConsoleData(28)

    // Low CTR opportunities
    const lowCTR = gscData.queries.filter(q => q.impressions > 100 && q.ctr < 0.02)
    if (lowCTR.length > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        title: `${lowCTR.length} queries have low CTR despite high impressions`,
        description: 'These queries get seen but not clicked. Improve meta titles/descriptions.',
        action: 'Update meta descriptions for pages ranking for these queries',
        data: { queries: lowCTR.slice(0, 5) },
      })
    }

    // First page opportunities (position 4-20)
    const nearFirstPage = gscData.queries.filter(q => q.position >= 4 && q.position <= 20)
    if (nearFirstPage.length > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        title: `${nearFirstPage.length} queries close to top 3`,
        description: 'Small ranking improvements could significantly increase clicks.',
        action: 'Add more content targeting these keywords',
        data: { queries: nearFirstPage.slice(0, 5) },
      })
    }

    // Top performing content
    const topContent = gscData.pages.filter(p => p.clicks > 10).slice(0, 5)
    if (topContent.length > 0) {
      insights.push({
        type: 'success',
        priority: 'low',
        title: 'Top performing pages',
        description: 'These pages drive the most organic traffic.',
        data: { pages: topContent },
      })
    }

    // Overall performance
    insights.push({
      type: gscData.totals.clicks > 100 ? 'success' : 'issue',
      priority: 'medium',
      title: `${gscData.totals.clicks} clicks from ${gscData.totals.impressions} impressions`,
      description: `Average CTR: ${(gscData.totals.ctr * 100).toFixed(1)}%, Avg position: ${gscData.totals.position.toFixed(1)}`,
      data: { totals: gscData.totals },
    })

  } catch (error) {
    insights.push({
      type: 'issue',
      priority: 'high',
      title: 'Could not fetch Search Console data',
      description: String(error),
    })
  }

  return insights
}
