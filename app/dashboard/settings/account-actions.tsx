'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'

export function AccountActions() {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const res = await fetch('/api/account/export')

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to export data')
      }

      // Get the JSON data and trigger download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coachreflect-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Redirect to home page after deletion
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Export your data or delete your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Export Data */}
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium">Export Your Data</p>
            <p className="text-sm text-muted-foreground">
              Download all your reflections, sessions, and data as JSON
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>

        {/* Delete Account */}
        <div className="pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            {!showDeleteConfirm && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-4">
              <p className="text-sm font-medium text-destructive">
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </p>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                    setError(null)
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
