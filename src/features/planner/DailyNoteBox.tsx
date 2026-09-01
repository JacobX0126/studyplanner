import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { useDailyNote, useSaveDailyNote } from './useDailyNotes'

export function DailyNoteBox({ date }: { date: string }) {
  const { data: note } = useDailyNote(date)
  const saveNote = useSaveDailyNote()
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setContent(note?.content ?? '')
    setSaved(false)
    setError('')
  }, [date, note])

  async function handleSave() {
    setSaved(false)
    setError('')
    try {
      await saveNote.mutateAsync({ date, content })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
    }
  }

  return (
    <Card>
      <CardTitle>How did today go?</CardTitle>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="A few words about the day..."
        rows={3}
        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={saveNote.isPending}>
          Save
        </Button>
        {saved && <span className="text-xs text-success">Saved.</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    </Card>
  )
}
