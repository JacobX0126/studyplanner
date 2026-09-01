import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { dDay, formatDate, formatDDay } from '@/lib/date'
import { QuestionForm } from '@/features/questions/QuestionForm'
import { QuestionList } from '@/features/questions/QuestionList'
import { useQuestionsByExam } from '@/features/questions/useQuestions'
import { ExamChecklist } from './ExamChecklist'
import { RetrospectiveForm } from './RetrospectiveForm'
import { useDeleteExam, useExams } from './useExams'

export function ExamDetailPage() {
  const { examId } = useParams<{ examId: string }>()
  const { data: exams, isLoading } = useExams()
  const deleteExam = useDeleteExam()
  const { data: questions } = useQuestionsByExam(examId ?? '')

  const exam = exams?.find((e) => e.id === examId)

  if (isLoading) {
    return <p className="p-4 text-sm text-text-muted">Loading...</p>
  }

  if (!exam) {
    return <Navigate to="/exams" replace />
  }

  const days = dDay(exam.exam_date)

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Link to="/exams" className="text-xs text-primary hover:underline">
        ← Exams
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">{exam.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            {exam.subjects && <Badge tone="primary">{exam.subjects.name}</Badge>}
            <span>{formatDate(exam.exam_date)}</span>
          </div>
        </div>
        <Badge tone={days < 0 ? 'default' : days <= 3 ? 'danger' : days <= 7 ? 'warning' : 'default'}>
          {formatDDay(exam.exam_date)}
        </Badge>
      </div>

      <ExamChecklist exam={exam} />

      <Card>
        <CardTitle>Past questions ({questions?.length ?? 0})</CardTitle>
        <div className="mt-3">
          <QuestionForm examId={exam.id} subjectId={exam.subject_id} />
        </div>
        <div className="mt-4">
          <QuestionList questions={questions ?? []} />
        </div>
      </Card>

      {days < 0 && <RetrospectiveForm exam={exam} />}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (confirm('Delete this exam? This does not delete its checklist tasks or questions.')) {
            deleteExam.mutate(exam.id)
          }
        }}
      >
        Delete exam
      </Button>
    </div>
  )
}
