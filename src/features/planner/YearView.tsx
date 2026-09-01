import { useState } from 'react'
import { eachDayOfInterval, startOfWeek } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { todayLocal, toLocalDateString } from '@/lib/date'
import { completionBucketClasses, completionClassFor, noPlanClass } from './completionColors'
import { useRangeCompletion } from './usePlanner'

export function YearView({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const [year, setYear] = useState(() => Number(selectedDate.slice(0, 4)))
  const rangeStart = `${year}-01-01`
  const rangeEnd = `${year}-12-31`
  const { data: completion } = useRangeCompletion(rangeStart, rangeEnd)
  const byDate = new Map((completion ?? []).map((d) => [d.date, d]))

  const gridStart = startOfWeek(new Date(`${year}-01-01T00:00:00`), { weekStartsOn: 1 })
  const gridEnd = new Date(`${year}-12-31T00:00:00`)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd }).map(toLocalDateString)
  const today = todayLocal()

  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setYear((y) => y - 1)}>
          ←
        </Button>
        <CardTitle>{year}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setYear((y) => y + 1)}>
          →
        </Button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="flex w-max gap-1">
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-1">
              {week.map((date) => {
                const inYear = date.startsWith(String(year))
                if (!inYear) return <div key={date} className="h-3 w-3 rounded-sm bg-transparent" />

                const entry = byDate.get(date)
                const pct = entry && entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : null

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onSelectDate(date)}
                    title={`${date}${entry ? ` · ${entry.done}/${entry.total}` : ''}`}
                    className={cn(
                      'h-3 w-3 rounded-sm transition-transform hover:scale-125',
                      completionClassFor(pct),
                      date === selectedDate && 'ring-1 ring-primary',
                      date === today && 'outline outline-1 outline-text-subtle',
                    )}
                  />
                )
              })}
            </div>
          ))}
        </div>
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
