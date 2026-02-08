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
                Free Plan: Limited to last {historyDays} days
              </p>
              <p className="text-sm text-muted-foreground">
                {hiddenCount > 0
                  ? `You have ${hiddenCount} older reflection${hiddenCount === 1 ? '' : 's'} saved. Upgrade to Pro to access your full history and track coaching patterns over time.`
                  : 'Your older reflections are saved. Upgrade to Pro to access your full history and track coaching patterns over time.'
                }
              </p>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-brand hover:bg-brand-hover whitespace-nowrap"
              size="sm"
            >
              Upgrade to Pro ($7.99/mo)
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
