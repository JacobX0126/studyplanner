import { useState } from 'react'
import { cn } from '@/lib/cn'
import { todayLocal } from '@/lib/date'
import { CompletionCalendar } from './CompletionCalendar'
import { DayView } from './DayView'
import { WeekView } from './WeekView'
import { YearView } from './YearView'

type View = 'day' | 'week' | 'month' | 'year'

const views: { key: View; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

export function PlannerPage() {
  const [view, setView] = useState<View>('day')
  const [selectedDate, setSelectedDate] = useState(todayLocal())

  function jumpToDay(date: string) {
    setSelectedDate(date)
    setView('day')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-xl font-semibold text-text">Planner</h1>

      <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface-muted p-1 text-sm">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={cn(
              'rounded-md py-1.5 font-medium transition-all',
              view === v.key ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'day' && <DayView selectedDate={selectedDate} onSelectDate={setSelectedDate} />}
      {view === 'week' && <WeekView selectedDate={selectedDate} onSelectDate={jumpToDay} />}
      {view === 'month' && <CompletionCalendar selectedDate={selectedDate} onSelectDate={jumpToDay} />}
      {view === 'year' && <YearView selectedDate={selectedDate} onSelectDate={jumpToDay} />}
    </div>
  )
}
