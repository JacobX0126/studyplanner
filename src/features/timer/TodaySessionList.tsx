import { useQuery } from '@tanstack/react-query'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { formatDuration } from '@/lib/date'
import { listTodaySessions } from './timerApi'

export function TodaySessionList() {
  const { data: sessions } = useQuery({
    queryKey: ['today-sessions'],
    queryFn: listTodaySessions,
  })

  const completed = sessions?.filter((s) => s.duration_seconds > 0) ?? []

  return (
    <Card>
      <CardTitle>Today's sessions</CardTitle>
      <div className="mt-2 space-y-2">
        {completed.length === 0 && <EmptyState title="No sessions recorded yet" />}
        {completed.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {s.subjects && <Badge tone="primary">{s.subjects.name}</Badge>}
              {s.todos && <span className="text-text-muted">{s.todos.title}</span>}
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span>{formatDuration(s.duration_seconds)}</span>
              {s.distraction_count > 0 && <span>· {s.distraction_count} distraction{s.distraction_count > 1 ? 's' : ''}</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
