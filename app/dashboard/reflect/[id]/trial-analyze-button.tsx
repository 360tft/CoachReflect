"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"

export function TrialAnalyzeButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleTrialAnalyze = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, mark the trial as used
      const trialResponse = await fetch('/api/pro-trial', {
        method: 'POST',
      })

      if (!trialResponse.ok) {
        const data = await trialResponse.json()
        if (data.hasUsedTrial) {
          setError('You have already used your free trial')
          return
        }
        throw new Error(data.error || 'Failed to activate trial')
      }

      // Then perform the analysis
      const response = await fetch(`/api/reflections/${id}/analyze`, {
        method: 'POST',
        headers: {
          'X-Pro-Trial': 'true', // Signal this is a trial use
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze reflection')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">sparkles symbol</span>
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            Try AI Insights Free
          </p>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
          Experience the power of AI coaching insights with a free trial. See how AI can help you grow as a coach.
        </p>
        <Button onClick={handleTrialAnalyze} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
          {loading ? 'Analyzing...' : 'Try AI Insights Free'}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>or</span>
        <Link href="/dashboard/settings" className="text-amber-600 hover:underline">
          Upgrade to Pro for unlimited AI insights
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
