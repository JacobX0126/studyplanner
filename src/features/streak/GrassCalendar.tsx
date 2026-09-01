import { eachDayOfInterval, startOfWeek } from 'date-fns'
import { cn } from '@/lib/cn'
import { monthsAgoLocal, todayLocal, toLocalDateString } from '@/lib/date'
import { useGrassCalendar } from './useStreak'

const grassToneClasses = ['bg-grass-0', 'bg-grass-1', 'bg-grass-2', 'bg-grass-3', 'bg-grass-4']

function grassClassFor(totalSeconds: number): string {
  if (totalSeconds <= 0) return grassToneClasses[0]
  if (totalSeconds < 25 * 60) return grassToneClasses[1]
  if (totalSeconds < 60 * 60) return grassToneClasses[2]
  if (totalSeconds < 120 * 60) return grassToneClasses[3]
  return grassToneClasses[4]
}

export function GrassCalendar() {
  const { data: stats } = useGrassCalendar(3)
  const byDate = new Map((stats ?? []).map((s) => [s.study_date, s]))

  const start = startOfWeek(new Date(monthsAgoLocal(3)), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end: new Date() }).map(toLocalDateString)
  const today = todayLocal()

  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex w-max gap-1">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((day) => {
              if (day > today) {
                return <div key={day} className="h-3 w-3 rounded-sm bg-transparent" />
              }
              const stat = byDate.get(day)
              const tone = stat?.rest_pass_used ? 'bg-grass-rest' : grassClassFor(stat?.total_seconds ?? 0)
              return (
                <div
                  key={day}
                  title={`${day}${stat ? ` · ${Math.round((stat.total_seconds ?? 0) / 60)}m` : ' · 0m'}`}
                  className={cn('h-3 w-3 rounded-sm', tone)}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-subtle">
        <span>Less</span>
        {grassToneClasses.map((c) => (
          <span key={c} className={cn('h-3 w-3 rounded-sm', c)} />
        ))}
        <span className="h-3 w-3 rounded-sm bg-grass-rest" />
        <span>More / rest pass</span>
      </div>
    </div>
  )
}
