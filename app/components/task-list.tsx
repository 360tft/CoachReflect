'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import type { Task } from '@/app/types'

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?status=pending&limit=5')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch {
      // Silently fail - widget is non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTask = async (taskId: string) => {
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId))

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
    } catch {
      // Refetch on error
      fetchTasks()
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || adding) return

    setAdding(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (res.ok) {
        setNewTitle('')
        fetchTasks()
      }
    } catch {
      // Silent fail
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const priorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500',
      medium: 'bg-amber-500',
      low: 'bg-gray-400',
    }
    return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} />
  }

  const sourceBadge = (source: string) => {
    if (source === 'ai_chat' || source === 'ai_reflection') {
      return (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
          AI
        </span>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Action Items</CardTitle>
          {tasks.length > 0 && (
            <Link href="/dashboard/tasks" className="text-sm text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending tasks. Tasks are created automatically when you reflect or chat, or you can add your own below.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="flex items-start gap-2 group">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-1 w-4 h-4 rounded border border-muted-foreground/40 hover:border-primary hover:bg-primary/10 flex-shrink-0 transition-colors"
                  aria-label={`Complete: ${task.title}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {priorityDot(task.priority)}
                    <span className="text-sm truncate">{task.title}</span>
                    {sourceBadge(task.source)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Inline add form */}
        <form onSubmit={addTask} className="mt-3 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 text-sm bg-transparent border-b border-muted-foreground/20 focus:border-primary outline-none py-1 placeholder:text-muted-foreground/50"
            maxLength={500}
          />
          <Button type="submit" variant="ghost" size="sm" disabled={!newTitle.trim() || adding}>
            +
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
