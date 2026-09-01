import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, todayLocal } from '@/lib/date'
import { ReviewButtons } from './ReviewButtons'
import { useWrongAnswers } from './useQuestions'

export function WrongAnswerPage() {
  const { data: questions, isLoading } = useWrongAnswers()

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div>
        <Link to="/exams" className="text-xs text-primary hover:underline">
          ← Exams
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-text">Wrong answers</h1>
        <p className="mt-1 text-sm text-text-muted">Questions marked X or unsure, across every exam.</p>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading...</p>}
      {!isLoading && (questions?.length ?? 0) === 0 && (
        <EmptyState title="No wrong answers" description="Anything marked X or 헷갈림 will show up here." />
      )}

      <div className="space-y-2">
        {questions?.map((q) => {
          const dueToday = q.next_review_date <= todayLocal()
          return (
            <Card key={q.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text">{q.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    {q.subjects && <Badge tone="primary">{q.subjects.name}</Badge>}
                    {q.exams && <span>{q.exams.title}</span>}
                    <span>Next review {formatDate(q.next_review_date)}</span>
                    {dueToday && <Badge tone="warning">Due today</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <ReviewButtons questionId={q.id} lastResult={q.last_result} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
