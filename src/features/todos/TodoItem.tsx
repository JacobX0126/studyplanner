import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, formatDuration } from '@/lib/date'
import { useConvertTodoToRecurring, useSetRecurringTaskActive } from '@/features/planner/useRecurringTasks'
import { useDeleteTodo, useToggleTodoDone, useUpdateTodoTitle } from './useTodos'
import type { TodoWithSubject } from './todosApi'

export function TodoItem({ todo }: { todo: TodoWithSubject }) {
  const toggleDone = useToggleTodoDone()
  const deleteTodo = useDeleteTodo()
  const updateTitle = useUpdateTodoTitle()
  const convertToRecurring = useConvertTodoToRecurring()
  const setRecurringActive = useSetRecurringTaskActive()

  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(todo.title)
  const [isRecurring, setIsRecurring] = useState(Boolean(todo.recurring_task_id))
  const [error, setError] = useState('')

  const estimatedSeconds = todo.estimated_minutes ? todo.estimated_minutes * 60 : null
  const ratio =
    estimatedSeconds && todo.actual_seconds > 0 ? todo.actual_seconds / estimatedSeconds : null

  function startEditing() {
    setDraftTitle(todo.title)
    setIsRecurring(Boolean(todo.recurring_task_id))
    setError('')
    setEditing(true)
  }

  async function handleSave() {
    const trimmed = draftTitle.trim()
    if (!trimmed) return
    setError('')

    try {
      if (trimmed !== todo.title) {
        await updateTitle.mutateAsync({ id: todo.id, title: trimmed })
      }

      const wasRecurring = Boolean(todo.recurring_task_id)
      if (isRecurring && !wasRecurring) {
        await convertToRecurring.mutateAsync({
          id: todo.id,
          title: trimmed,
          subject_id: todo.subject_id,
          estimated_minutes: todo.estimated_minutes,
        })
      } else if (!isRecurring && wasRecurring && todo.recurring_task_id) {
        await setRecurringActive.mutateAsync({ id: todo.recurring_task_id, active: false })
      }

      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
    }
  }

  function handleDelete() {
    if (confirm(`Delete "${todo.title}"? This can't be undone.`)) {
      deleteTodo.mutate(todo.id)
    }
  }

  if (editing) {
    return (
      <div className="space-y-2 border-b border-border py-3 last:border-b-0">
        <Input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <label className="flex items-center gap-2 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          Repeat every day (daily standard)
        </label>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={!draftTitle.trim()}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={todo.is_done}
        onChange={(e) => toggleDone.mutate({ id: todo.id, isDone: e.target.checked })}
        className="mt-1 h-4 w-4 accent-primary"
      />

      <div className="min-w-0 flex-1">
        <p className={todo.is_done ? 'text-sm text-text-subtle line-through' : 'text-sm text-text'}>
          {todo.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          {todo.subjects && <Badge tone="primary">{todo.subjects.name}</Badge>}
          {todo.recurring_task_id && <Badge tone="default">Daily</Badge>}
          {todo.due_date && <span>Due {formatDate(todo.due_date)}</span>}
          {todo.estimated_minutes && (
            <span>
              Est. {todo.estimated_minutes}m · Actual {formatDuration(todo.actual_seconds)}
              {ratio !== null && ratio > 0 && ` · ${ratio.toFixed(1)}× estimate`}
            </span>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={startEditing} aria-label="Edit">
        Edit
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDelete} aria-label="Delete">
        Delete
      </Button>
    </div>
  )
}
