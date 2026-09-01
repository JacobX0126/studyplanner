import { cn } from '@/lib/cn'
import type { QuestionResult } from '@/types/database'
import { useSubmitReview } from './useQuestions'

const options: { result: QuestionResult; label: string; activeClass: string }[] = [
  { result: 'o', label: 'O', activeClass: 'border-success bg-success-soft text-success' },
  { result: 'x', label: 'X', activeClass: 'border-danger bg-danger-soft text-danger' },
  { result: 'unsure', label: '헷갈림', activeClass: 'border-warning bg-warning-soft text-warning' },
]

export function ReviewButtons({
  questionId,
  lastResult,
}: {
  questionId: string
  lastResult: QuestionResult | null
}) {
  const submitReview = useSubmitReview()

  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.result}
          type="button"
          disabled={submitReview.isPending}
          onClick={() => submitReview.mutate({ questionId, result: opt.result })}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60',
            lastResult === opt.result
              ? opt.activeClass
              : 'border-border bg-surface text-text-muted hover:bg-surface-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
