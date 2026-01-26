"use client"

import { useState, useRef, useEffect } from "react"

interface EditableTitleProps {
  sessionId: string
  initialTitle: string
}

export function EditableTitle({ sessionId, initialTitle }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!title.trim()) {
      setTitle(initialTitle)
      setIsEditing(false)
      return
    }

    if (title === initialTitle) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!res.ok) {
        setTitle(initialTitle)
      }
    } catch {
      setTitle(initialTitle)
    } finally {
      setSaving(false)
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setTitle(initialTitle)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none w-full"
        placeholder="Enter session title..."
      />
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-2xl font-bold text-left hover:text-primary transition-colors group flex items-center gap-2"
      title="Click to edit title"
    >
      <span>{title}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </button>
  )
}
