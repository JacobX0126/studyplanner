import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { SubjectPicker } from '@/features/subjects/SubjectPicker'
import { useCreateTodo } from './useTodos'

export function TodoForm() {
  const createTodo = useCreateTodo()
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    await createTodo.mutateAsync({
      title: trimmed,
      subject_id: subjectId,
      due_date: dueDate || null,
      estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
    })

    setTitle('')
    setDueDate('')
    setEstimatedMinutes('')
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="todo-title">Task</Label>
          <Input
            id="todo-title"
            placeholder="e.g. Chapter 3 practice problems"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label>Subject</Label>
            <SubjectPicker value={subjectId} onChange={setSubjectId} allowEmpty />
          </div>
          <div>
            <Label htmlFor="todo-due">Due date</Label>
            <Input
              id="todo-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="todo-estimate">Estimated time (min)</Label>
            <Input
              id="todo-estimate"
              type="number"
              min={1}
              placeholder="e.g. 60"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={createTodo.isPending || !title.trim()}>
          Add
        </Button>
      </form>
    </Card>
  )
}
