'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { UpgradeModal } from '@/app/components/upgrade-modal'

interface HistoryUpgradeBannerProps {
  historyDays: number
  hiddenCount: number
}

export function HistoryUpgradeBanner({ historyDays, hiddenCount }: HistoryUpgradeBannerProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold">
                You have reflections you can&apos;t see
              </p>
              <p className="text-sm text-muted-foreground">
                {hiddenCount > 0
                  ? `You have ${hiddenCount} reflection${hiddenCount === 1 ? '' : 's'} with coaching insights you've already earned. Unlock your full history with Pro.`
                  : "Your older reflections are saved with insights you've already earned. Unlock them with Pro."
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">Try free for 7 days.</p>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-brand hover:bg-brand-hover whitespace-nowrap"
              size="sm"
            >
              Unlock History — 7-Day Free Trial
            </Button>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        variant="history"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
