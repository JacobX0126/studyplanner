import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { DistractionTrend } from './DistractionTrend'
import { SubjectShare } from './SubjectShare'
import { useDailyTotals } from './useStats'
import { WeeklyBars } from './WeeklyBars'
import { GrassCalendar } from '@/features/streak/GrassCalendar'
import { StreakCard } from '@/features/streak/StreakCard'

export function StatsPage() {
  const { data: totals } = useDailyTotals(30)
  const hasAnyData = (totals ?? []).some((d) => d.total_seconds > 0)

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold text-text">Stats</h1>

      {!hasAnyData && (
        <Card>
          <CardTitle>Nothing to show yet</CardTitle>
          <p className="mt-2 text-sm text-text-muted">
            These charts fill in once you've logged some study time with the timer.
          </p>
          <Link to="/timer" className="mt-3 inline-block text-sm text-primary hover:underline">
            Start your first timer →
          </Link>
        </Card>
      )}

      <WeeklyBars />

      <StreakCard />

      <Card>
        <CardTitle>Study calendar</CardTitle>
        <div className="mt-3">
          <GrassCalendar />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SubjectShare />
        <DistractionTrend />
      </div>
    </div>
  )
}
