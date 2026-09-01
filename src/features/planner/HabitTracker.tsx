import { useState } from 'react'
import { addWeeks, eachDayOfInterval, endOfWeek, format, startOfWeek, subWeeks } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { toLocalDateString } from '@/lib/date'
import { useHabitGrid, useToggleHabitDay } from './useRecurringTasks'

export function HabitTracker() {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())
  const weekStartDate = startOfWeek(weekAnchor, { weekStartsOn: 1 })
  const weekEndDate = endOfWeek(weekAnchor, { weekStartsOn: 1 })
  const dates = eachDayOfInterval({ start: weekStartDate, end: weekEndDate }).map(toLocalDateString)

  const { data, isError, error } = useHabitGrid(dates[0], dates[6])
  const toggle = useToggleHabitDay()
  const tasks = (data?.tasks ?? []).filter((t) => t.active)

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekAnchor((d) => subWeeks(d, 1))}>
          ←
        </Button>
        <div className="text-center">
          <CardTitle>Habit tracker</CardTitle>
          <p className="text-xs text-text-subtle">Week of {format(weekStartDate, 'MMM d')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}>
          →
        </Button>
      </div>

      {isError && <p className="mt-3 text-xs text-danger">{error instanceof Error ? error.message : 'Could not load habits.'}</p>}

      {!isError && tasks.length === 0 && (
        <div className="mt-2">
          <EmptyState
            title="No daily standards yet"
            description="Check 'Repeat every day' when adding a task above to start tracking it here."
          />
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[380px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-28 pb-2 text-left font-medium text-text-subtle">Habit</th>
                {dates.map((date) => (
                  <th key={date} className="pb-2 text-center font-medium text-text-subtle">
                    {format(new Date(date), 'EEE')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-border">
                  <td className="max-w-[7rem] truncate py-2 pr-2 text-text" title={task.title}>
                    {task.title}
                  </td>
                  {dates.map((date) => {
                    const startedYet = task.created_at.slice(0, 10) <= date
                    const done = data?.doneByCell.get(`${task.id}|${date}`) ?? false
                    return (
                      <td key={date} className="py-2 text-center">
                        <button
                          type="button"
                          disabled={!startedYet}
                          onClick={() => toggle.mutate({ recurringTaskId: task.id, date })}
                          aria-label={`${task.title} on ${date}`}
                          className={cn(
                            'mx-auto flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                            !startedYet
                              ? 'border-transparent'
                              : done
                                ? 'border-success bg-success'
                                : 'border-border hover:border-primary',
                          )}
                        >
                          {done && <span className="text-[10px] leading-none text-white">✓</span>}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
