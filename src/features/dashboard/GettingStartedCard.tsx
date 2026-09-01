import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useCreateSubject } from '@/features/subjects/useSubjects'

/** 과목이 하나도 없는 완전 첫 방문자에게만 보이는 시작 카드.
 * 과목이 없으면 타이머/투두/시험 어디서도 사실상 할 게 없어서, 여기서 바로 첫 과목을 만들게 한다. */
export function GettingStartedCard() {
  const createSubject = useCreateSubject()
  const [name, setName] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    await createSubject.mutateAsync({ name: trimmed })
    setName('')
  }

  return (
    <Card className="border-primary/30 bg-primary-soft">
      <CardTitle>Welcome to StudyPlanner 👋</CardTitle>
      <p className="mt-1 text-sm text-text-muted">
        Everything here — to-dos, exams, streaks, stats — builds on top of study time you log with the
        timer. Add your first subject to unlock it.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Input
          autoFocus
          placeholder="e.g. Math, Chemistry, English"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={createSubject.isPending || !name.trim()}>
          Add subject
        </Button>
      </form>
    </Card>
  )
}
