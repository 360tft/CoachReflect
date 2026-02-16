'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Task } from '@/app/types'

interface Props {
  reflectionId: string
  aiActionItems: string[]
}

export function ActionItemsChecklist({ reflectionId, aiActionItems }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?limit=50`)
      if (res.ok) {
        const allTasks: Task[] = await res.json()
        // Filter to tasks for this reflection
        const reflectionTasks = allTasks.filter(t => t.reflection_id === reflectionId)
        setTasks(reflectionTasks)
      }
    } catch {
      // Fall through to showing raw items
    } finally {
      setLoaded(true)
    }
  }, [reflectionId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
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

  // If we have tasks from the DB, show them with real checkboxes
  if (loaded && tasks.length > 0) {
    return (
      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="flex items-start gap-2">
            <button
              onClick={() => toggleTask(task.id, task.status)}
              className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 transition-colors flex items-center justify-center ${
                task.status === 'completed'
                  ? 'bg-primary border-primary text-white'
                  : 'border-muted-foreground/40 hover:border-primary'
              }`}
              aria-label={task.status === 'completed' ? `Uncomplete: ${task.title}` : `Complete: ${task.title}`}
            >
              {task.status === 'completed' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`text-muted-foreground ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  // Fallback: show raw ai_action_items as static checkboxes (pre-migration data)
  if (aiActionItems.length > 0) {
    return (
      <ul className="space-y-2">
        {aiActionItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  return null
}
