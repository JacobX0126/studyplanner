import { useState } from 'react'
import { eachDayOfInterval } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { daysAgoLocal, formatDate, toLocalDateString } from '@/lib/date'
import { useDailyTotals } from './useStats'

export function WeeklyBars() {
  const [range, setRange] = useState<7 | 30>(7)
  const { data } = useDailyTotals(range)

  const byDate = new Map((data ?? []).map((d) => [d.study_date, d.total_seconds]))
  const allDates = eachDayOfInterval({ start: new Date(daysAgoLocal(range - 1)), end: new Date() }).map(
    toLocalDateString,
  )

  const chartData = allDates.map((date) => ({
    date: formatDate(date, 'M/d'),
    minutes: Math.round((byDate.get(date) ?? 0) / 60),
  }))

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Study time</CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant={range === 7 ? 'primary' : 'ghost'} onClick={() => setRange(7)}>
            7d
          </Button>
          <Button size="sm" variant={range === 30 ? 'primary' : 'ghost'} onClick={() => setRange(30)}>
            30d
          </Button>
        </div>
      </div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval={range === 30 ? 3 : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v}m`, 'Study time']} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="minutes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
