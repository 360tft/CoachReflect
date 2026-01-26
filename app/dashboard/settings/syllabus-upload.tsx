'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface Syllabus {
  id: string
  title: string
  file_url: string
  file_type: string
  original_filename: string
  processing_status: string
  created_at: string
}

interface SyllabusUploadProps {
  initialSyllabus: Syllabus | null
  canUpload: boolean
  subscriptionTier: string
}

export function SyllabusUpload({ initialSyllabus, canUpload, subscriptionTier }: SyllabusUploadProps) {
  const [syllabus, setSyllabus] = useState<Syllabus | null>(initialSyllabus)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', 'My Coaching Syllabus')

      const res = await fetch('/api/syllabus/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setSyllabus(data.syllabus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your syllabus?')) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/syllabus', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }

      setSyllabus(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄'
      case 'image': return '🖼️'
      case 'audio': return '🎵'
      default: return '📁'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Club Syllabus</CardTitle>
        <CardDescription>
          Upload your coaching syllabus to give the AI context about your coaching philosophy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canUpload ? (
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">
              Syllabus upload is available on Pro+ plan.
              {subscriptionTier === 'pro' && ' Upgrade to unlock this feature.'}
            </p>
          </div>
        ) : syllabus ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getFileIcon(syllabus.file_type)}</span>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {syllabus.title}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {syllabus.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded {new Date(syllabus.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The AI will reference this syllabus when responding to your reflections.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="syllabus-upload"
              />
              <label
                htmlFor="syllabus-upload"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-2">📚</div>
                <p className="font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload your syllabus'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, images, or audio files (max 50MB)
                </p>
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Your syllabus helps the AI understand your coaching philosophy and provide more relevant insights.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}
