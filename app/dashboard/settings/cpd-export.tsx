"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { DatePicker } from "@/app/components/ui/date-picker"
import Link from "next/link"

interface CPDExportProps {
  isSubscribed: boolean
}

export function CPDExport({ isSubscribed }: CPDExportProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date
  })
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    return new Date()
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    if (!isSubscribed || !startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      const start = format(startDate, 'yyyy-MM-dd')
      const end = format(endDate, 'yyyy-MM-dd')
      // Open in new tab for printing
      window.open(`/api/export/cpd?start=${start}&end=${end}&format=html`, '_blank')
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
            <Link href="/dashboard/settings">
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
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="Select start date"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="Select end date"
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
