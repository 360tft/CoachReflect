"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "./button"

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onImageRemove: () => void
  selectedImage: File | null
  disabled?: boolean
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  selectedImage,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("Image must be less than 10MB")
        return
      }

      // Create preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      onImageSelect(file)
    },
    [onImageSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [disabled, handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    onImageRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [previewUrl, onImageRemove])

  if (selectedImage && previewUrl) {
    return (
      <div className="relative rounded-lg border-2 border-dashed border-border overflow-hidden">
        <img
          src={previewUrl}
          alt="Session plan preview"
          className="w-full h-64 object-contain bg-muted"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
        <div className="p-3 bg-muted/50 text-sm text-center">
          <p className="font-medium">{selectedImage.name}</p>
          <p className="text-muted-foreground">
            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="space-y-4">
        <div className="text-4xl">📋</div>
        <div>
          <p className="font-medium">
            {isDragging ? "Drop your session plan here" : "Upload your session plan"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop an image, or click to select
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            disabled={disabled}
          >
            Choose File
          </Button>
          {/* Camera capture for mobile */}
          <label className="sm:hidden cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
              disabled={disabled}
            />
            <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
              Take Photo
            </span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, or WebP • Max 10MB
        </p>
      </div>
    </div>
  )
}
