"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface ReferralStats {
  total_referrals: number
  signed_up: number
  converted: number
  credits_earned: number
}

interface Referral {
  status: string
  signed_up_at: string | null
  converted_at: string | null
  reward_type: string | null
}

interface ReferralDashboardProps {
  referralCode: string
  stats: ReferralStats
  recentReferrals: Referral[]
}

export function ReferralDashboard({ referralCode, stats, recentReferrals }: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false)
  const referralLink = `https://coachreflection.com/signup?ref=${referralCode}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent("I've been using CoachReflection to improve my coaching through reflection. Join me and get better together!")
    const url = encodeURIComponent(referralLink)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`I've been using CoachReflection to improve my coaching. Try it out: ${referralLink}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link with other coaches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border font-mono"
            />
            <Button onClick={copyLink} variant="outline">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Your code:</span>
            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{referralCode}</code>
            <Button onClick={copyCode} variant="ghost" size="sm">
              Copy Code
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={shareOnTwitter} variant="outline" size="sm" className="gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </Button>
            <Button onClick={shareOnWhatsApp} variant="outline" size="sm" className="gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total_referrals}</div>
            <p className="text-sm text-muted-foreground">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.signed_up}</div>
            <p className="text-sm text-muted-foreground">Signed Up</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.converted}</div>
            <p className="text-sm text-muted-foreground">Upgraded to Pro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.credits_earned}</div>
            <p className="text-sm text-muted-foreground">Free Months Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Referrals */}
      {recentReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReferrals.map((referral, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      referral.status === 'rewarded' ? 'bg-green-500' :
                      referral.status === 'converted' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="text-sm capitalize">
                      {referral.status === 'signed_up' ? 'Signed Up' :
                       referral.status === 'converted' ? 'Upgraded' :
                       referral.status === 'rewarded' ? 'Rewarded' :
                       referral.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {referral.signed_up_at ? new Date(referral.signed_up_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">How Rewards Work</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1 free month of Pro for each referral who upgrades</li>
            <li>Credits are automatically applied to your next billing cycle</li>
            <li>No limit on how many coaches you can refer</li>
            <li>Credits never expire</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
