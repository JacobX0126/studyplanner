import { useState } from 'react'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateSubject, useSubjects } from './useSubjects'

export function SubjectPicker({
  value,
  onChange,
  allowEmpty = false,
  disabled = false,
}: {
  value: string | null
  onChange: (subjectId: string | null) => void
  allowEmpty?: boolean
  disabled?: boolean
}) {
  const { data: subjects, isLoading } = useSubjects()
  const createSubject = useCreateSubject()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    const created = await createSubject.mutateAsync({ name })
    onChange(created.id)
    setNewName('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder="New subject name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button type="button" size="sm" onClick={handleAdd} disabled={createSubject.isPending}>
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Select
      value={value ?? ''}
      disabled={disabled || isLoading}
      onChange={(e) => {
        if (e.target.value === '__new__') {
          setAdding(true)
          return
        }
        onChange(e.target.value || null)
      }}
    >
      {allowEmpty && <option value="">No subject</option>}
      {!allowEmpty && <option value="" disabled>
        Choose a subject
      </option>}
      {subjects?.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
      <option value="__new__">+ Add new subject</option>
    </Select>
  )
}
