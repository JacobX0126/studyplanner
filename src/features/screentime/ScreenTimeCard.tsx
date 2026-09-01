import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import { useMyScreenTime, useUpsertScreenTime } from './useScreenTime'

/** 일요일에만 대시보드에 뜨는 입력 카드. 값 자체는 설정 화면에서 언제든 고칠 수 있다. */
export function ScreenTimeCard() {
  const isSunday = new Date().getDay() === 0
  const { data: entry } = useMyScreenTime()
  const upsert = useUpsertScreenTime()

  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry) {
      setHours(String(Math.floor(entry.minutes / 60)))
      setMinutes(String(entry.minutes % 60))
    }
  }, [entry])

  if (!isSunday) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0)
    try {
      await upsert.mutateAsync(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
    }
  }

  return (
    <Card>
      <CardTitle>This week's screen time</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">
        We can't read your phone's screen time from the browser, so enter it yourself.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <div className="w-20">
          <Label htmlFor="screen-hours">Hours</Label>
          <Input id="screen-hours" type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <div className="w-20">
          <Label htmlFor="screen-minutes">Minutes</Label>
          <Input
            id="screen-minutes"
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" disabled={upsert.isPending}>
          {entry ? 'Update' : 'Save'}
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  )
}
