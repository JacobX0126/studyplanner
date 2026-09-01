import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import type { SubjectRow } from '@/types/database'
import { useArchiveSubject, useSubjects, useUpdateSubject } from './useSubjects'

function SubjectRowItem({ subject }: { subject: SubjectRow }) {
  const updateSubject = useUpdateSubject()
  const archiveSubject = useArchiveSubject()

  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(subject.name)
  const [error, setError] = useState('')

  async function handleColorChange(color: string) {
    try {
      await updateSubject.mutateAsync({ id: subject.id, color })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
    }
  }

  async function handleSaveName() {
    const trimmed = draftName.trim()
    if (!trimmed) return
    setError('')
    try {
      await updateSubject.mutateAsync({ id: subject.id, name: trimmed })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
    }
  }

  function handleRemove() {
    if (confirm(`Remove "${subject.name}"? Past sessions and to-dos keep their history, but you won't be able to pick it again.`)) {
      archiveSubject.mutate(subject.id)
    }
  }

  return (
    <div className="space-y-1 border-b border-border py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={subject.color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
          aria-label={`Color for ${subject.name}`}
        />

        {editing ? (
          <>
            <Input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="flex-1"
            />
            <Button size="sm" onClick={handleSaveName} disabled={!draftName.trim()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm text-text">{subject.name}</span>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={handleRemove}>
              Remove
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export function SubjectsSection() {
  const { data: subjects, isLoading } = useSubjects()

  return (
    <Card>
      <CardTitle>Subjects</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">Rename, recolor, or remove a subject.</p>
      <div className="mt-2">
        {isLoading && <p className="text-sm text-text-muted">Loading...</p>}
        {!isLoading && (subjects?.length ?? 0) === 0 && (
          <EmptyState title="No subjects yet" description="Add one from the timer or to-do screen." />
        )}
        {subjects?.map((s) => <SubjectRowItem key={s.id} subject={s} />)}
      </div>
    </Card>
  )
}
