import { supabase } from '@/lib/supabase'
import { daysAgoLocal } from '@/lib/date'
import type { DailyStatsRow } from '@/types/database'

export async function getDailyTotals(days: number): Promise<DailyStatsRow[]> {
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .gte('study_date', daysAgoLocal(days - 1))
    .order('study_date', { ascending: true })

  if (error) throw error
  return data
}

export interface SubjectSeconds {
  subject_id: string
  name: string
  color: string
  seconds: number
}

export async function getSubjectShare(days: number): Promise<SubjectSeconds[]> {
  const [{ data: timeRows, error: timeError }, { data: subjects, error: subjectsError }] = await Promise.all([
    supabase.from('v_subject_time').select('subject_id, seconds').gte('study_date', daysAgoLocal(days - 1)),
    supabase.from('subjects').select('id, name, color'),
  ])

  if (timeError) throw timeError
  if (subjectsError) throw subjectsError

  const subjectById = new Map((subjects ?? []).map((s) => [s.id as string, s]))
  const totals = new Map<string, number>()
  for (const row of timeRows ?? []) {
    totals.set(row.subject_id, (totals.get(row.subject_id) ?? 0) + row.seconds)
  }

  return Array.from(totals, ([subjectId, seconds]) => ({
    subject_id: subjectId,
    name: subjectById.get(subjectId)?.name ?? 'Unknown subject',
    color: subjectById.get(subjectId)?.color ?? '#94a3b8',
    seconds,
  })).sort((a, b) => b.seconds - a.seconds)
}
