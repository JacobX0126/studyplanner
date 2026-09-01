import { supabase } from '@/lib/supabase'
import { todayLocal } from '@/lib/date'
import type { StudySessionRow } from '@/types/database'

export interface SessionWithNames extends StudySessionRow {
  subjects: { name: string; color: string } | null
  todos: { title: string } | null
}

export async function startSession(subjectId: string, todoId: string | null): Promise<StudySessionRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userData.user.id,
      subject_id: subjectId,
      todo_id: todoId,
      started_at: new Date().toISOString(),
      study_date: todayLocal(),
      duration_seconds: 0,
      distraction_count: 0,
      is_completed: false,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function finishSession(
  sessionId: string,
  durationSeconds: number,
  distractionCount: number,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      distraction_count: distractionCount,
      is_completed: completed,
    })
    .eq('id', sessionId)

  if (error) throw error
}

/** 시작하자마자 0초로 끝난 세션은 기록할 의미가 없으므로 삭제한다. */
export async function discardSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('study_sessions').delete().eq('id', sessionId)
  if (error) throw error
}

export async function setStudyPresence(isStudying: boolean): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { error } = await supabase.from('study_presence').upsert({
    user_id: userData.user.id,
    is_studying: isStudying,
    session_started_at: isStudying ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

export async function listTodaySessions(): Promise<SessionWithNames[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*, subjects(name, color), todos(title)')
    .eq('study_date', todayLocal())
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTodayTotalSeconds(): Promise<number> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('daily_stats')
    .select('total_seconds')
    .eq('study_date', todayLocal())
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (error) throw error
  return data?.total_seconds ?? 0
}
