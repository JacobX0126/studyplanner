import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ExamDetailPage } from '@/features/exams/ExamDetailPage'
import { ExamListPage } from '@/features/exams/ExamListPage'
import { FriendsPage } from '@/features/friends/FriendsPage'
import { PlannerPage } from '@/features/planner/PlannerPage'
import { WrongAnswerPage } from '@/features/questions/WrongAnswerPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { StatsPage } from '@/features/stats/StatsPage'
import { TimerPage } from '@/features/timer/TimerPage'
import { TodoPage } from '@/features/todos/TodoPage'

function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/timer" element={<Protected><TimerPage /></Protected>} />
      <Route path="/todos" element={<Protected><TodoPage /></Protected>} />
      <Route path="/planner" element={<Protected><PlannerPage /></Protected>} />
      <Route path="/exams" element={<Protected><ExamListPage /></Protected>} />
      <Route path="/exams/wrong-answers" element={<Protected><WrongAnswerPage /></Protected>} />
      <Route path="/exams/:examId" element={<Protected><ExamDetailPage /></Protected>} />
      <Route path="/stats" element={<Protected><StatsPage /></Protected>} />
      <Route path="/friends" element={<Protected><FriendsPage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
    </Routes>
  )
}

export default App
