import { supabase } from '@/lib/supabase'

const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  exportedAt: string
  subjects: unknown[]
  exams: unknown[]
  todos: unknown[]
  studySessions: unknown[]
  questions: unknown[]
  questionReviews: unknown[]
  screenTimeEntries: unknown[]
  userSettings: unknown | null
}

/** daily_stats/streaks/rest_passes는 study_sessions로부터 트리거가 자동 재계산하므로
 * 백업에 포함하지 않는다 — 세션만 복원되면 나머지는 저절로 다시 맞춰진다. */
export async function exportBackup(): Promise<BackupData> {
  const [subjects, exams, todos, studySessions, questions, questionReviews, screenTimeEntries, userSettings] =
    await Promise.all([
      supabase.from('subjects').select('*').then(r => r.data ?? []),
      supabase.from('exams').select('*').then(r => r.data ?? []),
      supabase.from('todos').select('*').then(r => r.data ?? []),
      supabase.from('study_sessions').select('*').then(r => r.data ?? []),
      supabase.from('questions').select('*').then(r => r.data ?? []),
      supabase.from('question_reviews').select('*').then(r => r.data ?? []),
      supabase.from('screen_time_entries').select('*').then(r => r.data ?? []),
      supabase.from('user_settings').select('*').maybeSingle().then(r => r.data ?? null),
    ])

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    subjects,
    exams,
    todos,
    studySessions,
    questions,
    questionReviews,
    screenTimeEntries,
    userSettings,
  }
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `studyplanner-backup-${data.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function withUserId<T extends Record<string, unknown>>(rows: T[], userId: string): T[] {
  return rows.map((row) => ({ ...row, user_id: userId }))
}

/** 파일 안 user_id는 무시하고 지금 로그인한 계정 걸로 덮어써서 복원한다 —
 * 그래야 같은 파일을 다시 불러와도 안전하고(업서트), 다른 계정 파일을 잘못 올려도
 * 남의 데이터가 아니라 내 데이터로 들어온다. FK 순서를 지켜 단계별로 넣는다. */
export async function importBackup(raw: unknown): Promise<void> {
  const data = raw as Partial<BackupData>
  if (!data || typeof data !== 'object' || !Array.isArray(data.subjects)) {
    throw new Error('That does not look like a StudyPlanner backup file.')
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')
  const userId = userData.user.id

  const steps: Array<[string, unknown[] | undefined]> = [
    ['subjects', data.subjects],
    ['exams', data.exams],
    ['todos', data.todos],
    ['study_sessions', data.studySessions],
    ['questions', data.questions],
    ['question_reviews', data.questionReviews],
    ['screen_time_entries', data.screenTimeEntries],
  ]

  for (const [table, rows] of steps) {
    if (!rows || rows.length === 0) continue
    const { error } = await supabase
      .from(table)
      .upsert(withUserId(rows as Record<string, unknown>[], userId))
    if (error) throw new Error(`Failed while restoring ${table}: ${error.message}`)
  }

  if (data.userSettings) {
    const { error } = await supabase
      .from('user_settings')
      .update({ ...(data.userSettings as Record<string, unknown>), user_id: undefined })
      .eq('user_id', userId)
    if (error) throw new Error(`Failed while restoring settings: ${error.message}`)
  }
}
