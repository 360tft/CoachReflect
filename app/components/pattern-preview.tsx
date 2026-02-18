'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { UpgradeModal } from '@/app/components/upgrade-modal'
import { NativeHidden } from '@/app/components/native-hidden'

interface PatternPreviewProps {
  topTheme: string
  themeCount: number
  totalReflections: number
}

export function PatternPreview({ topTheme, themeCount, totalReflections }: PatternPreviewProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  return (
    <NativeHidden>
      <Card className="border border-amber-200/60 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-amber-950/15 dark:to-orange-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Patterns emerging from your reflections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Visible real insight */}
          <div className="rounded-lg bg-background/80 dark:bg-background/40 border border-border/50 p-3">
            <p className="text-sm">
              Your most common coaching focus: <span className="font-semibold text-foreground">{topTheme}</span>{' '}
              <span className="text-muted-foreground">(mentioned {themeCount} times across {totalReflections} sessions)</span>
            </p>
          </div>

          {/* Blurred locked insights */}
          <div className="space-y-2">
            <div className="relative rounded-lg bg-background/80 dark:bg-background/40 border border-border/50 p-3 overflow-hidden">
              <div className="blur-[6px] select-none" aria-hidden="true">
                <p className="text-sm">3 players tracked across sessions. Two need extra attention this month.</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/90 dark:bg-background/80 px-2.5 py-1 rounded-full border border-border/50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pro
                </span>
              </div>
            </div>
            <div className="relative rounded-lg bg-background/80 dark:bg-background/40 border border-border/50 p-3 overflow-hidden">
              <div className="blur-[6px] select-none" aria-hidden="true">
                <p className="text-sm">Energy dips correlate with sessions over 75 minutes. Consider shorter blocks.</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/90 dark:bg-background/80 px-2.5 py-1 rounded-full border border-border/50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pro
                </span>
              </div>
            </div>
            <div className="relative rounded-lg bg-background/80 dark:bg-background/40 border border-border/50 p-3 overflow-hidden">
              <div className="blur-[6px] select-none" aria-hidden="true">
                <p className="text-sm">Your coaching confidence peaks mid-week. Weekend sessions show more uncertainty.</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/90 dark:bg-background/80 px-2.5 py-1 rounded-full border border-border/50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pro
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-2">
              Pro coaches see 4 weeks of patterns. You are looking at 7 days.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold transition-all"
            >
              See the full picture
            </button>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        variant="analytics"
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </NativeHidden>
  )
}
