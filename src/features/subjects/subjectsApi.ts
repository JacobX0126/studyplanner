import { supabase } from '@/lib/supabase'
import type { SubjectRow } from '@/types/database'

// 새 과목을 만들 때 순서대로 돌려가며 배정하는 팔레트 — 색을 안 정해주면
// 전부 같은 색으로 저장돼서 "과목별 비중" 차트에서 구분이 안 되는 문제를 막는다.
const SUBJECT_COLOR_PALETTE = [
  '#4f46e5', // indigo
  '#0891b2', // cyan
  '#d97706', // amber
  '#db2777', // pink
  '#16a34a', // green
  '#7c3aed', // violet
  '#dc2626', // red
  '#0d9488', // teal
]

export async function listSubjects(): Promise<SubjectRow[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createSubject(input: { name: string; color?: string }): Promise<SubjectRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  let color = input.color
  if (!color) {
    const { count } = await supabase
      .from('subjects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
    color = SUBJECT_COLOR_PALETTE[(count ?? 0) % SUBJECT_COLOR_PALETTE.length]
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({ name: input.name, color, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateSubject(id: string, patch: { name?: string; color?: string }): Promise<void> {
  const { error } = await supabase.from('subjects').update(patch).eq('id', id)
  if (error) throw error
}

export async function archiveSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').update({ archived: true }).eq('id', id)
  if (error) throw error
}

const OTHER_SUBJECT_NAME = 'Other'

/** 타이머 시작할 때 과목을 안 골랐으면 쓰는 기본 과목. 있으면 그대로 재사용한다. */
export async function getOrCreateOtherSubject(): Promise<SubjectRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data: existing, error: existingError } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('name', OTHER_SUBJECT_NAME)
    .eq('archived', false)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return existing

  return createSubject({ name: OTHER_SUBJECT_NAME, color: '#64748b' })
}
