"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface ReferralStats {
  total: number
  pending: number
  completed: number
  rewarded: number
  totalRewards: number
}

interface ReferralData {
  referralCode: string
  stats: ReferralStats
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  async function fetchReferralData() {
    try {
      const res = await fetch('/api/referrals')
      if (!res.ok) throw new Error('Failed to fetch referral data')
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Failed to load referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function copyReferralLink() {
    if (!data?.referralCode) return

    const referralUrl = `${window.location.origin}/signup?ref=${data.referralCode}`

    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <Card className="border bg-gradient-to-br from-background to-orange-50 dark:from-background/30 dark:to-orange-950/30 dark:border">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/10 rounded-lg">
              <svg className="w-5 h-5 text-primary dark:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-primary dark:text-primary">
                Refer Friends, Get Rewards
              </h3>
              <p className="text-sm text-primary dark:text-amber-300">
                {data.stats.total > 0
                  ? `${data.stats.total} referral${data.stats.total !== 1 ? 's' : ''}, ${data.stats.totalRewards} days earned`
                  : 'Get 7 days of Pro free for each friend who subscribes'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyReferralLink}
              className="text-primary border hover:bg-primary/10 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-primary/10"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Link href="/dashboard/referrals">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
