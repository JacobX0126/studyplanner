import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useCreateQuestion } from './useQuestions'

export function QuestionForm({ examId, subjectId }: { examId: string; subjectId: string | null }) {
  const createQuestion = useCreateQuestion()
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    await createQuestion.mutateAsync({
      exam_id: examId,
      subject_id: subjectId,
      title: trimmed,
      source: source.trim() || null,
      memo: memo.trim() || null,
    })

    setTitle('')
    setSource('')
    setMemo('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="q-title">Question</Label>
        <Input
          id="q-title"
          placeholder="e.g. 2023 mock exam, question 14"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="q-source">Source / link</Label>
          <Input
            id="q-source"
            placeholder="e.g. textbook p.42"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="q-memo">Memo</Label>
          <Input
            id="q-memo"
            placeholder="Optional note"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={createQuestion.isPending || !title.trim()}>
        Add question
      </Button>
    </form>
  )
}
