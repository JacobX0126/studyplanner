import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { dDay, formatDate, formatDDay, formatDuration, todayLocal } from '@/lib/date'
import { useExams } from '@/features/exams/useExams'
import { TopFriendsCard } from '@/features/friends/TopFriendsCard'
import { ScreenTimeCard } from '@/features/screentime/ScreenTimeCard'
import { useSubjects } from '@/features/subjects/useSubjects'
import { StreakCard } from '@/features/streak/StreakCard'
import { getTodayTotalSeconds } from '@/features/timer/timerApi'
import { useTodos } from '@/features/todos/useTodos'
import { GettingStartedCard } from './GettingStartedCard'

export function DashboardPage() {
  const { data: todaySeconds } = useQuery({
    queryKey: ['today-total-seconds'],
    queryFn: getTodayTotalSeconds,
  })
  const { data: todos } = useTodos()
  const { data: exams } = useExams()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()

  const todayTodos = (todos ?? []).filter((t) => !t.is_done)
  const today = todayLocal()
  const plannedToday = (todos ?? []).filter((t) => t.due_date === today)
  const plannedDone = plannedToday.filter((t) => t.is_done).length
  const plannedPercent =
    plannedToday.length > 0 ? Math.round((plannedDone / plannedToday.length) * 100) : 0
  const nextExam = (exams ?? [])
    .filter((e) => dDay(e.exam_date) >= 0)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0]

  // 과목이 하나도 없으면 다른 카드는 전부 비어 보일 뿐이라, 첫 화면은 시작 카드 하나로 단순화한다.
  if (!subjectsLoading && (subjects?.length ?? 0) === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <GettingStartedCard />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold text-text">Dashboard</h1>

      <ScreenTimeCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Today's study time</CardTitle>
          <p className="mt-2 text-2xl font-semibold text-text">
            {formatDuration(todaySeconds ?? 0)}
          </p>
          <Link to="/timer" className="mt-2 inline-block text-xs text-primary hover:underline">
            Start the timer →
          </Link>
        </Card>

        <Card>
          <CardTitle>To-do today ({todayTodos.length})</CardTitle>
          <div className="mt-2 space-y-1">
            {todayTodos.length === 0 && <EmptyState title="Nothing on your list" />}
            {todayTodos.slice(0, 5).map((t) => (
              <p key={t.id} className="truncate text-sm text-text">
                · {t.title}
              </p>
            ))}
          </div>
          <Link to="/todos" className="mt-2 inline-block text-xs text-primary hover:underline">
            View to-do list →
          </Link>
        </Card>

        <Card>
          <CardTitle>Today's plan</CardTitle>
          {plannedToday.length === 0 ? (
            <EmptyState title="Nothing planned yet" />
          ) : (
            <>
              <p className="mt-2 text-2xl font-semibold text-text">{plannedPercent}%</p>
              <p className="mt-1 text-xs text-text-muted">
                {plannedDone} / {plannedToday.length} done
              </p>
            </>
          )}
          <Link to="/planner" className="mt-2 inline-block text-xs text-primary hover:underline">
            Open planner →
          </Link>
        </Card>

        <StreakCard />

        <Card>
          <CardTitle>Next exam</CardTitle>
          {nextExam ? (
            <>
              <p className="mt-2 text-2xl font-semibold text-text">{formatDDay(nextExam.exam_date)}</p>
              <p className="mt-1 text-xs text-text-muted">
                {nextExam.title} · {formatDate(nextExam.exam_date)}
              </p>
            </>
          ) : (
            <EmptyState title="No exams scheduled" />
          )}
          <Link to="/exams" className="mt-2 inline-block text-xs text-primary hover:underline">
            View exams →
          </Link>
        </Card>

        <TopFriendsCard />
      </div>
    </div>
  )
}
