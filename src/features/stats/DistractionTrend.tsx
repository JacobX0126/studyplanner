import { eachDayOfInterval } from 'date-fns'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardTitle } from '@/components/ui/Card'
import { daysAgoLocal, formatDate, toLocalDateString } from '@/lib/date'
import { useDailyTotals } from './useStats'

const RANGE_DAYS = 14

export function DistractionTrend() {
  const { data } = useDailyTotals(RANGE_DAYS)
  const byDate = new Map((data ?? []).map((d) => [d.study_date, d]))

  const allDates = eachDayOfInterval({
    start: new Date(daysAgoLocal(RANGE_DAYS - 1)),
    end: new Date(),
  }).map(toLocalDateString)

  const chartData = allDates.map((date) => {
    const stat = byDate.get(date)
    const avg = stat && stat.session_count > 0 ? stat.distraction_count / stat.session_count : null
    return { date: formatDate(date, 'M/d'), avg }
  })

  return (
    <Card>
      <CardTitle>Distractions per session</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">Last {RANGE_DAYS} days, days without a session are skipped.</p>
      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} allowDecimals />
            <Tooltip
              formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Avg distractions']}
              contentStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="var(--color-warning)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
