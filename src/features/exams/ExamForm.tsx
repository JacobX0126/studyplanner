import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import { formatDate } from '@/lib/date'
import { SubjectPicker } from '@/features/subjects/SubjectPicker'
import { useCreateExam, usePastRetrospectives } from './useExams'

export function ExamForm() {
  const createExam = useCreateExam()
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [examDate, setExamDate] = useState('')

  const { data: pastRetrospectives } = usePastRetrospectives(subjectId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || !examDate) return

    await createExam.mutateAsync({ title: trimmed, subject_id: subjectId, exam_date: examDate })

    setTitle('')
    setExamDate('')
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="exam-title">Exam</Label>
          <Input
            id="exam-title"
            placeholder="e.g. Midterm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Subject</Label>
            <SubjectPicker value={subjectId} onChange={setSubjectId} allowEmpty />
          </div>
          <div>
            <Label htmlFor="exam-date">Date</Label>
            <Input
              id="exam-date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </div>
        </div>

        {pastRetrospectives && pastRetrospectives.length > 0 && (
          <div className="rounded-md bg-surface-muted p-3">
            <p className="text-xs font-medium text-text-muted">Past retrospectives for this subject</p>
            <div className="mt-1.5 space-y-1.5">
              {pastRetrospectives.map((r) => (
                <p key={r.id} className="text-xs text-text-subtle">
                  {formatDate(r.exam_date)} · {r.title}
                  {r.score !== null && ` (${r.score})`} — {r.retrospective}
                </p>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" disabled={createExam.isPending || !title.trim() || !examDate}>
          Add exam
        </Button>
      </form>
    </Card>
  )
}
