import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { todayLocal, toLocalDateString } from '@/lib/date'
import { completionBucketClasses, completionClassFor, noPlanClass } from './completionColors'
import { useRangeCompletion } from './usePlanner'

const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function CompletionCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date(selectedDate)))

  const monthStart = toLocalDateString(startOfMonth(monthAnchor))
  const monthEnd = toLocalDateString(endOfMonth(monthAnchor))
  const { data: completion } = useRangeCompletion(monthStart, monthEnd)
  const byDate = new Map((completion ?? []).map((d) => [d.date, d]))

  const gridStart = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const today = todayLocal()

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setMonthAnchor((m) => subMonths(m, 1))}>
          ←
        </Button>
        <CardTitle>{format(monthAnchor, 'MMMM yyyy')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setMonthAnchor((m) => addMonths(m, 1))}>
          →
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-text-subtle">
        {weekdayLabels.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = toLocalDateString(day)
          const inMonth = isSameMonth(day, monthAnchor)
          const entry = byDate.get(dateStr)
          const pct = entry && entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : null

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              title={entry ? `${entry.done}/${entry.total} done` : 'No tasks planned'}
              className={cn(
                'aspect-square rounded-md text-xs font-medium transition-transform hover:scale-105',
                completionClassFor(pct),
                !inMonth && 'opacity-30',
                dateStr === selectedDate && 'ring-2 ring-primary ring-offset-1 ring-offset-surface',
                dateStr === today && 'font-bold underline decoration-2 underline-offset-2',
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-text-subtle">
        <span>Less</span>
        <span className={cn('h-3 w-3 rounded-sm', noPlanClass)} />
        {completionBucketClasses.map((c) => (
          <span key={c} className={cn('h-3 w-3 rounded-sm', c)} />
        ))}
        <span>More done</span>
      </div>
    </Card>
  )
}
