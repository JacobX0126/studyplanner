import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDuration } from '@/lib/date'
import { useSubjectShare } from './useStats'

const RANGE_DAYS = 30

export function SubjectShare() {
  const { data } = useSubjectShare(RANGE_DAYS)
  const subjects = (data ?? []).filter((s) => s.seconds > 0)

  return (
    <Card>
      <CardTitle>Time by subject</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">Last {RANGE_DAYS} days</p>

      {subjects.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No study time yet" />
        </div>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjects} dataKey="seconds" nameKey="name" innerRadius={35} outerRadius={65} paddingAngle={2}>
                  {subjects.map((s) => (
                    <Cell key={s.subject_id} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => (typeof v === 'number' ? formatDuration(v) : v)}
                  contentStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {subjects.map((s) => (
              <div key={s.subject_id} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="min-w-0 flex-1 truncate text-text">{s.name}</span>
                <span className="text-text-muted">{formatDuration(s.seconds)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
