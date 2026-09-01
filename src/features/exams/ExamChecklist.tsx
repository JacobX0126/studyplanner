import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { dDay } from '@/lib/date'
import { TodoItem } from '@/features/todos/TodoItem'
import { useCreateTodo, useTodos } from '@/features/todos/useTodos'
import type { ExamRow } from '@/types/database'

export function ExamChecklist({ exam }: { exam: ExamRow }) {
  const { data: todos } = useTodos()
  const createTodo = useCreateTodo()
  const [title, setTitle] = useState('')

  const examTodos = (todos ?? []).filter((t) => t.exam_id === exam.id)
  const incomplete = examTodos.filter((t) => !t.is_done)
  const days = dDay(exam.exam_date)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    await createTodo.mutateAsync({
      title: trimmed,
      subject_id: exam.subject_id,
      exam_id: exam.id,
      due_date: null,
      estimated_minutes: null,
    })
    setTitle('')
  }

  return (
    <Card>
      <CardTitle>Study checklist</CardTitle>

      {days >= 0 && (
        <p className="mt-1 text-xs text-text-muted">
          {days} day{days === 1 ? '' : 's'} left · {incomplete.length} incomplete
          {days > 0 && ` · ${(incomplete.length / days).toFixed(1)}/day needed`}
        </p>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <Input
          placeholder="Add a study task for this exam"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={createTodo.isPending || !title.trim()}>
          Add
        </Button>
      </form>

      <div className="mt-3">
        {examTodos.length === 0 ? (
          <EmptyState title="Nothing here yet" description="Break the exam down into tasks above." />
        ) : (
          examTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        )}
      </div>
    </Card>
  )
}
