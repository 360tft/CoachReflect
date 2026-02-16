'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import type { Task, TaskStatus } from '@/app/types'

type FilterStatus = 'all' | TaskStatus

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filter !== 'all') params.set('status', filter)
      const res = await fetch(`/api/tasks?${params}`)
      if (res.ok) {
        setTasks(await res.json())
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus as TaskStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
          : t
      )
    )
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      fetchTasks()
    }
  }

  const dismissTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      })
    } catch {
      fetchTasks()
    }
  }

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    } catch {
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
      // Silent
    } finally {
      setAdding(false)
    }
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const completedCount = tasks.filter(t => t.status === 'completed').length

  const priorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500',
      medium: 'bg-amber-500',
      low: 'bg-gray-400',
    }
    return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} />
  }

  const sourceBadge = (source: string) => {
    const labels: Record<string, string> = {
      ai_chat: 'Chat',
      ai_reflection: 'Analysis',
      manual: 'Manual',
    }
    const isAI = source.startsWith('ai_')
    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
        isAI ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {labels[source] || source}
      </span>
    )
  }

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Dismissed', value: 'dismissed' },
  ]

  // Sort: pending first (high > medium > low), then completed by completed_at desc
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    if (a.status === 'pending' && b.status === 'pending') {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            {pendingCount} pending, {completedCount} completed
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Add task form */}
      <Card>
        <CardContent className="py-3">
          <form onSubmit={addTask} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 text-sm bg-transparent border-b border-muted-foreground/20 focus:border-primary outline-none py-1 placeholder:text-muted-foreground/50"
              maxLength={500}
            />
            <Button type="submit" size="sm" disabled={!newTitle.trim() || adding}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Task list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {filter === 'all' ? 'All Tasks' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Tasks`}
          </CardTitle>
          <CardDescription>
            Action items from your reflections, chats, and manual entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : sortedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tasks found. Tasks are created automatically from AI analysis and chat.
            </p>
          ) : (
            <ul className="divide-y">
              {sortedTasks.map(task => (
                <li key={task.id} className="py-3 flex items-start gap-3 group">
                  <button
                    onClick={() => toggleTask(task.id, task.status)}
                    className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 transition-colors flex items-center justify-center ${
                      task.status === 'completed'
                        ? 'bg-primary border-primary text-white'
                        : 'border-muted-foreground/40 hover:border-primary hover:bg-primary/10'
                    }`}
                    aria-label={task.status === 'completed' ? `Uncomplete: ${task.title}` : `Complete: ${task.title}`}
                  >
                    {task.status === 'completed' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {priorityDot(task.priority)}
                      <span className={`text-sm ${
                        task.status === 'completed' ? 'line-through opacity-60' : ''
                      } ${task.status === 'dismissed' ? 'opacity-40' : ''}`}>
                        {task.title}
                      </span>
                      {sourceBadge(task.source)}
                    </div>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => dismissTask(task.id)}
                        className="text-xs text-muted-foreground hover:text-foreground px-1"
                        title="Dismiss"
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-1"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
