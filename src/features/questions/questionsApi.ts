import { supabase } from '@/lib/supabase'
import type { QuestionResult, QuestionRow } from '@/types/database'

export interface QuestionWithContext extends QuestionRow {
  exams: { title: string; exam_date: string } | null
  subjects: { name: string; color: string } | null
}

export async function listQuestionsByExam(examId: string): Promise<QuestionRow[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export interface CreateQuestionInput {
  exam_id: string | null
  subject_id: string | null
  title: string
  source: string | null
  memo: string | null
}

export async function createQuestion(input: CreateQuestionInput): Promise<QuestionRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('questions')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}

/** 채점 기록 -> DB 트리거(apply_question_review)가 간격 반복 값을 자동 갱신한다. */
export async function submitReview(questionId: string, result: QuestionResult): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { error } = await supabase
    .from('question_reviews')
    .insert({ question_id: questionId, result, user_id: userData.user.id })

  if (error) throw error
}

export async function listWrongAnswers(): Promise<QuestionWithContext[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*, exams(title, exam_date), subjects(name, color)')
    .in('last_result', ['x', 'unsure'])
    .order('next_review_date', { ascending: true })

  if (error) throw error
  return data
}
