import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label, Select } from '@/components/ui/Input'
import { getOrCreateOtherSubject } from '@/features/subjects/subjectsApi'
import { SubjectPicker } from '@/features/subjects/SubjectPicker'
import { useTodos } from '@/features/todos/useTodos'
import { formatClock } from '@/lib/date'
import { DistractionButton } from './DistractionButton'
import { TodaySessionList } from './TodaySessionList'
import { useTimer } from './useTimer'

const phaseLabel = { idle: 'Idle', focus: 'Focus', break: 'Break' } as const

export function TimerPage() {
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [todoId, setTodoId] = useState<string | null>(null)
  const { data: todos } = useTodos()

  const timer = useTimer(subjectId, todoId)
  const isIdle = timer.phase === 'idle'

  // 진행 중인 세션을 복원했다면(새로고침 등) 그 세션의 과목/투두를 보여준다.
  const displaySubjectId = isIdle ? subjectId : timer.subjectId
  const displayTodoId = isIdle ? todoId : timer.todoId

  const availableTodos = useMemo(
    () => (todos ?? []).filter((t) => !t.is_done && (!displaySubjectId || t.subject_id === displaySubjectId)),
    [todos, displaySubjectId],
  )

  const progress =
    timer.phase === 'focus'
      ? 1 - timer.remainingSeconds / (timer.focusMinutes * 60)
      : timer.phase === 'break'
        ? 1 - timer.remainingSeconds / (timer.breakMinutes * 60)
        : 0

  const [starting, setStarting] = useState(false)

  async function handleStart() {
    setStarting(true)
    try {
      if (subjectId) {
        await timer.start()
        return
      }
      // 과목을 안 골랐으면 "Other"로 대신 시작한다.
      const other = await getOrCreateOtherSubject()
      setSubjectId(other.id)
      await timer.start(other.id, todoId)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <h1 className="text-xl font-semibold text-text">Timer</h1>

      <Card>
        <div className="space-y-3">
          <div>
            <Label>Subject</Label>
            <SubjectPicker value={displaySubjectId} onChange={setSubjectId} disabled={!isIdle} />
          </div>

          {displaySubjectId && (
            <div>
              <Label>Link a to-do (optional)</Label>
              <Select
                value={displayTodoId ?? ''}
                disabled={!isIdle}
                onChange={(e) => setTodoId(e.target.value || null)}
              >
                <option value="">Not linked</option>
                {availableTodos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Card>

      <Card className="flex flex-col items-center gap-4 py-8">
        <span className="text-sm font-medium text-text-muted">{phaseLabel[timer.phase]}</span>

        <div className="relative flex h-48 w-48 items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="7" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={timer.phase === 'break' ? 'var(--color-success)' : 'var(--color-primary)'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="text-4xl font-semibold tabular-nums text-text">
            {formatClock(timer.remainingSeconds)}
          </span>
        </div>

        <div className="flex gap-2">
          {isIdle && (
            <Button size="lg" disabled={starting} onClick={handleStart}>
              {starting ? 'Starting...' : 'Start'}
            </Button>
          )}
          {!isIdle && timer.isRunning && (
            <Button size="lg" variant="secondary" onClick={timer.pause}>
              Pause
            </Button>
          )}
          {!isIdle && !timer.isRunning && (
            <Button size="lg" onClick={timer.resume}>
              Resume
            </Button>
          )}
          {!isIdle && (
            <Button size="lg" variant="ghost" onClick={timer.reset}>
              Reset
            </Button>
          )}
        </div>

        {timer.phase === 'focus' && (
          <div className="mt-4 w-full border-t border-border pt-4">
            <div className="flex justify-center">
              <DistractionButton
                count={timer.distractionCount}
                disabled={!timer.isRunning}
                onClick={timer.addDistraction}
              />
            </div>
          </div>
        )}
      </Card>

      <TodaySessionList />
    </div>
  )
}
