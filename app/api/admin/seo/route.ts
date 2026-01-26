import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import {
  getSearchConsoleData,
  getAnalyticsData,
  generateSEOInsights,
} from '@/lib/google-apis'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check admin access
    if (!user || !isAdminUser(user.email, user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get days parameter
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '28', 10)

    const response: {
      searchConsole?: Awaited<ReturnType<typeof getSearchConsoleData>>
      analytics?: Awaited<ReturnType<typeof getAnalyticsData>>
      insights?: Awaited<ReturnType<typeof generateSEOInsights>>
      searchConsoleError?: string
      analyticsError?: string
    } = {}

    // Fetch Search Console data
    try {
      response.searchConsole = await getSearchConsoleData(days)
    } catch (error) {
      console.error('Search Console error:', error)
      response.searchConsoleError = error instanceof Error ? error.message : 'Failed to fetch Search Console data'
    }

    // Fetch Analytics data
    try {
      response.analytics = await getAnalyticsData(days)
    } catch (error) {
      console.error('Analytics error:', error)
      response.analyticsError = error instanceof Error ? error.message : 'Failed to fetch Analytics data'
    }

    // Generate insights
    try {
      response.insights = await generateSEOInsights()
    } catch (error) {
      console.error('Insights error:', error)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('SEO API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SEO data' },
      { status: 500 }
    )
  }
}
