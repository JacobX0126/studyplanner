import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { formatDate, shiftDateLocal, todayLocal } from '@/lib/date'
import { TodoItem } from '@/features/todos/TodoItem'
import { useCreateTodo, useTodos } from '@/features/todos/useTodos'
import { DailyNoteBox } from './DailyNoteBox'
import { HabitTracker } from './HabitTracker'
import { RecurringTasksSection } from './RecurringTasksSection'
import { useCreateRecurringTask, useEnsureInstancesForDate } from './useRecurringTasks'

export function DayView({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const { data: todos } = useTodos()
  const createTodo = useCreateTodo()
  const createRecurringTask = useCreateRecurringTask()
  const ensureInstances = useEnsureInstancesForDate()

  const [title, setTitle] = useState('')
  const [repeatDaily, setRepeatDaily] = useState(false)
  const [addError, setAddError] = useState('')

  // 이 날짜를 볼 때마다 아직 안 만들어진 반복 태스크의 todo를 채워 넣는다.
  useEffect(() => {
    ensureInstances.mutate(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const dayTodos = (todos ?? []).filter((t) => t.due_date === selectedDate)
  const doneCount = dayTodos.filter((t) => t.is_done).length
  const total = dayTodos.length
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const isToday = selectedDate === todayLocal()

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setAddError('')

    try {
      if (repeatDaily) {
        await createRecurringTask.mutateAsync({ title: trimmed, subject_id: null, estimated_minutes: null })
        await ensureInstances.mutateAsync(selectedDate)
      } else {
        await createTodo.mutateAsync({
          title: trimmed,
          subject_id: null,
          due_date: selectedDate,
          estimated_minutes: null,
        })
      }
      setTitle('')
      setRepeatDaily(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add that task.')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSelectDate(shiftDateLocal(selectedDate, -1))}>
            ←
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              {isToday ? 'Today' : formatDate(selectedDate, 'EEEE, MMM d')}
            </p>
            {!isToday && (
              <button
                type="button"
                onClick={() => onSelectDate(todayLocal())}
                className="text-xs text-primary hover:underline"
              >
                Back to today
              </button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onSelectDate(shiftDateLocal(selectedDate, 1))}>
            →
          </Button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">
              {doneCount} / {total} done
            </span>
            <span className="font-semibold text-text">{percent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <form onSubmit={handleAdd} className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a task for this day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button
              type="submit"
              size="sm"
              disabled={createTodo.isPending || createRecurringTask.isPending || !title.trim()}
            >
              Add
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={repeatDaily}
              onChange={(e) => setRepeatDaily(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Repeat every day (daily standard)
          </label>
          {addError && <p className="text-xs text-danger">{addError}</p>}
        </form>

        <div className="mt-3">
          {total === 0 ? (
            <EmptyState title="Nothing planned" description="Add a task above to start your plan for this day." />
          ) : (
            dayTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
          )}
        </div>
      </Card>

      <RecurringTasksSection />
      <HabitTracker />
      <DailyNoteBox date={selectedDate} />
    </div>
  )
}
