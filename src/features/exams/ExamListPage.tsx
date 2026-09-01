import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { dDay, formatDate, formatDDay } from '@/lib/date'
import { ExamForm } from './ExamForm'
import { useExams } from './useExams'

function ddayTone(days: number): 'danger' | 'warning' | 'default' {
  if (days <= 3) return 'danger'
  if (days <= 7) return 'warning'
  return 'default'
}

export function ExamListPage() {
  const { data: exams, isLoading } = useExams()

  const upcoming = (exams ?? []).filter((e) => dDay(e.exam_date) >= 0)
  const past = (exams ?? []).filter((e) => dDay(e.exam_date) < 0)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Exams</h1>
        <Link to="/exams/wrong-answers" className="text-xs text-primary hover:underline">
          Wrong answers →
        </Link>
      </div>

      <ExamForm />

      <Card>
        <CardTitle>Upcoming ({upcoming.length})</CardTitle>
        <div className="mt-2">
          {isLoading && <p className="text-sm text-text-muted">Loading...</p>}
          {!isLoading && upcoming.length === 0 && (
            <EmptyState title="No upcoming exams" description="Add one above to start planning." />
          )}
          {upcoming.map((exam) => {
            const days = dDay(exam.exam_date)
            return (
              <Link
                key={exam.id}
                to={`/exams/${exam.id}`}
                className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0 hover:opacity-80"
              >
                <div className="min-w-0">
                  <p className="text-sm text-text">{exam.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    {exam.subjects && <Badge tone="primary">{exam.subjects.name}</Badge>}
                    <span>{formatDate(exam.exam_date)}</span>
                  </div>
                </div>
                <Badge tone={ddayTone(days)}>{formatDDay(exam.exam_date)}</Badge>
              </Link>
            )
          })}
        </div>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardTitle>Past ({past.length})</CardTitle>
          <div className="mt-2">
            {past.map((exam) => (
              <Link
                key={exam.id}
                to={`/exams/${exam.id}`}
                className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0 hover:opacity-80"
              >
                <div className="min-w-0">
                  <p className="text-sm text-text">{exam.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    {exam.subjects && <Badge tone="primary">{exam.subjects.name}</Badge>}
                    <span>{formatDate(exam.exam_date)}</span>
                  </div>
                </div>
                {exam.retrospective_at ? (
                  <Badge tone="success">Reviewed</Badge>
                ) : (
                  <Badge tone="warning">Add retrospective</Badge>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
