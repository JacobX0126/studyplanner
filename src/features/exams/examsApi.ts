import { supabase } from '@/lib/supabase'
import type { ExamRow } from '@/types/database'

export interface ExamWithSubject extends ExamRow {
  subjects: { name: string; color: string } | null
}

export async function listExams(): Promise<ExamWithSubject[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*, subjects(name, color)')
    .order('exam_date', { ascending: true })

  if (error) throw error
  return data
}

export interface CreateExamInput {
  title: string
  subject_id: string | null
  exam_date: string
}

export async function createExam(input: CreateExamInput): Promise<ExamRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('exams')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) throw error
}

export async function saveRetrospective(
  id: string,
  input: { score: number | null; retrospective: string },
): Promise<void> {
  const { error } = await supabase
    .from('exams')
    .update({ ...input, retrospective_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

/** 새 시험을 등록할 때, 같은 과목의 지난 회고를 보여주기 위한 조회. */
export async function listPastRetrospectives(subjectId: string): Promise<ExamRow[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('subject_id', subjectId)
    .not('retrospective', 'is', null)
    .order('exam_date', { ascending: false })
    .limit(5)

  if (error) throw error
  return data
}
