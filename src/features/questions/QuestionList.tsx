import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, todayLocal } from '@/lib/date'
import type { QuestionRow } from '@/types/database'
import { ReviewButtons } from './ReviewButtons'
import { useDeleteQuestion } from './useQuestions'

export function QuestionList({ questions }: { questions: QuestionRow[] }) {
  const deleteQuestion = useDeleteQuestion()

  if (questions.length === 0) {
    return <EmptyState title="No questions yet" description="Add past exam questions below to start reviewing." />
  }

  return (
    <div className="space-y-2">
      {questions.map((q) => {
        const dueToday = q.next_review_date <= todayLocal()
        return (
          <div key={q.id} className="rounded-md border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text">{q.title}</p>
                {(q.source || q.memo) && (
                  <p className="mt-0.5 text-xs text-text-subtle">
                    {[q.source, q.memo].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  {q.last_result && (
                    <span>Reviewed {q.review_count}×</span>
                  )}
                  <span>Next review {formatDate(q.next_review_date)}</span>
                  {dueToday && <Badge tone="warning">Due today</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteQuestion.mutate(q.id)} aria-label="Delete">
                Delete
              </Button>
            </div>
            <div className="mt-2">
              <ReviewButtons questionId={q.id} lastResult={q.last_result} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
