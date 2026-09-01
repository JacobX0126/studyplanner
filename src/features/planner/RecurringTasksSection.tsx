import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { RecurringTaskRow } from '@/types/database'
import {
  useDeleteRecurringTask,
  useRecurringTasks,
  useSetRecurringTaskActive,
  useUpdateRecurringTaskTitle,
} from './useRecurringTasks'

function RecurringTaskRowItem({ task }: { task: RecurringTaskRow }) {
  const setActive = useSetRecurringTaskActive()
  const deleteTask = useDeleteRecurringTask()
  const updateTitle = useUpdateRecurringTaskTitle()

  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const [error, setError] = useState('')

  async function handleSave() {
    const trimmed = draftTitle.trim()
    if (!trimmed) return
    setError('')
    try {
      await updateTitle.mutateAsync({ id: task.id, title: trimmed })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
    }
  }

  function handleDelete() {
    if (confirm(`Delete the daily standard "${task.title}"? Past days already logged stay, but it stops repeating.`)) {
      deleteTask.mutate(task.id)
    }
  }

  if (editing) {
    return (
      <div className="space-y-2 py-1">
        <div className="flex gap-2">
          <Input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" onClick={handleSave} disabled={!draftTitle.trim()}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className={task.active ? 'text-text' : 'text-text-subtle'}>
        {task.title}
        {!task.active && ' (paused)'}
      </span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setActive.mutate({ id: task.id, active: !task.active })}>
          {task.active ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}

export function RecurringTasksSection() {
  const { data: tasks } = useRecurringTasks()

  if (!tasks || tasks.length === 0) return null

  const active = tasks.filter((t) => t.active)
  const paused = tasks.filter((t) => !t.active)

  return (
    <Card>
      <CardTitle>Daily standards</CardTitle>
      <div className="mt-2 space-y-1.5">
        {[...active, ...paused].map((t) => (
          <RecurringTaskRowItem key={t.id} task={t} />
        ))}
      </div>
    </Card>
  )
}
