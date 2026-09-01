import { useState } from 'react'
import { addWeeks, eachDayOfInterval, endOfWeek, format, startOfWeek, subWeeks } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { todayLocal, toLocalDateString } from '@/lib/date'
import { useTodos } from '@/features/todos/useTodos'

export function WeekView({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date(selectedDate))
  const { data: todos } = useTodos()

  const weekStartDate = startOfWeek(weekAnchor, { weekStartsOn: 1 })
  const weekEndDate = endOfWeek(weekAnchor, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStartDate, end: weekEndDate }).map(toLocalDateString)
  const today = todayLocal()

  const byDate = days.map((date) => {
    const dayTodos = (todos ?? []).filter((t) => t.due_date === date)
    const done = dayTodos.filter((t) => t.is_done).length
    const total = dayTodos.length
    return { date, done, total, pct: total > 0 ? Math.round((done / total) * 100) : null }
  })

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekAnchor((d) => subWeeks(d, 1))}>
          ←
        </Button>
        <CardTitle>
          {format(weekStartDate, 'MMM d')} – {format(weekEndDate, 'MMM d')}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}>
          →
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        {byDate.map(({ date, done, total, pct }) => (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-surface-muted',
              date === selectedDate && 'border-primary bg-primary-soft',
            )}
          >
            <span className={cn('text-sm', date === today ? 'font-semibold text-text' : 'text-text')}>
              {format(new Date(date), 'EEEE, MMM d')}
              {date === today && <span className="ml-1.5 text-xs text-primary">Today</span>}
            </span>
            <span className="shrink-0 text-xs text-text-muted">
              {total === 0 ? 'No tasks' : `${done}/${total} · ${pct}%`}
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}
