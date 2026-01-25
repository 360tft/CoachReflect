"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"

interface CPDExportProps {
  isSubscribed: boolean
}

export function CPDExport({ isSubscribed }: CPDExportProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    if (!isSubscribed) return

    setLoading(true)
    setError(null)

    try {
      // Open in new tab for printing
      window.open(`/api/export/cpd?start=${startDate}&end=${endDate}&format=html`, '_blank')
    } catch {
      setError("Failed to generate export")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CPD Export</CardTitle>
        <CardDescription>
          Generate a Continuing Professional Development report for your coaching license
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSubscribed ? (
          <div className="p-4 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground mb-4">
              CPD Export is available for Pro subscribers
            </p>
            <Link href="/pricing">
              <Button className="bg-brand hover:bg-brand-hover" size="sm">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              <p>The export will include:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Activity summary (reflections, themes, players)</li>
                <li>Coaching themes covered with examples</li>
                <li>Key insights from your reflections</li>
                <li>Signature section for verification</li>
              </ul>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover"
            >
              {loading ? "Generating..." : "Generate CPD Report"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Opens in a new tab. Use your browser&apos;s print function to save as PDF.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
