import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import type { ExamRow } from '@/types/database'
import { useSaveRetrospective } from './useExams'

export function RetrospectiveForm({ exam }: { exam: ExamRow }) {
  const saveRetrospective = useSaveRetrospective()
  const [score, setScore] = useState('')
  const [retrospective, setRetrospective] = useState('')

  if (exam.retrospective_at) {
    return (
      <Card>
        <CardTitle>Retrospective</CardTitle>
        <p className="mt-2 text-sm text-text">
          {exam.score !== null ? `Score: ${exam.score}` : 'No score recorded'}
        </p>
        <p className="mt-1 text-sm text-text-muted">{exam.retrospective}</p>
      </Card>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = retrospective.trim()
    if (!trimmed) return

    await saveRetrospective.mutateAsync({
      id: exam.id,
      score: score ? Number(score) : null,
      retrospective: trimmed,
    })
  }

  return (
    <Card>
      <CardTitle>Retrospective</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">This exam is over. How did it go?</p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <Label htmlFor="retro-score">Score</Label>
          <Input
            id="retro-score"
            type="number"
            placeholder="Optional"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="retro-note">What was missing?</Label>
          <Input
            id="retro-note"
            placeholder="One line is enough"
            value={retrospective}
            onChange={(e) => setRetrospective(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={saveRetrospective.isPending || !retrospective.trim()}>
          Save
        </Button>
      </form>
    </Card>
  )
}
