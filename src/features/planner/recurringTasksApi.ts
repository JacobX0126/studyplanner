import { supabase } from '@/lib/supabase'
import type { RecurringTaskRow } from '@/types/database'

export async function listRecurringTasks(): Promise<RecurringTaskRow[]> {
  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export interface CreateRecurringTaskInput {
  title: string
  subject_id: string | null
  estimated_minutes: number | null
}

export async function createRecurringTask(input: CreateRecurringTaskInput): Promise<RecurringTaskRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('recurring_tasks')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function setRecurringTaskActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('recurring_tasks').update({ active }).eq('id', id)
  if (error) throw error
}

export async function updateRecurringTaskTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('recurring_tasks').update({ title }).eq('id', id)
  if (error) throw error
}

/** 일반 투두를 "매일 반복"으로 바꾼다 — 템플릿을 새로 만들고 이 투두를 거기 연결한다. */
export async function convertTodoToRecurring(todo: {
  id: string
  title: string
  subject_id: string | null
  estimated_minutes: number | null
}): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data: task, error } = await supabase
    .from('recurring_tasks')
    .insert({
      user_id: userData.user.id,
      title: todo.title,
      subject_id: todo.subject_id,
      estimated_minutes: todo.estimated_minutes,
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: linkError } = await supabase
    .from('todos')
    .update({ recurring_task_id: task.id })
    .eq('id', todo.id)
  if (linkError) throw linkError
}

export async function deleteRecurringTask(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_tasks').delete().eq('id', id)
  if (error) throw error
}

/** 이 날짜에 아직 안 만들어진 반복 태스크의 todo를 채워 넣는다 (있으면 건너뜀).
 * 반복 태스크가 만들어지기 전 날짜에는 만들지 않는다 — 시작 전 과거를 "안 함"으로 채우면 안 되니까. */
export async function ensureInstancesForDate(date: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')
  const userId = userData.user.id

  const { data: tasks, error: tasksError } = await supabase
    .from('recurring_tasks')
    .select('id, subject_id, title, estimated_minutes, created_at')
    .eq('active', true)
  if (tasksError) throw tasksError
  const due = (tasks ?? []).filter((t) => (t.created_at as string).slice(0, 10) <= date)
  if (due.length === 0) return

  const { data: existing, error: existingError } = await supabase
    .from('todos')
    .select('recurring_task_id')
    .eq('due_date', date)
    .not('recurring_task_id', 'is', null)
  if (existingError) throw existingError
  const existingIds = new Set((existing ?? []).map((t) => t.recurring_task_id as string))

  const missing = due.filter((t) => !existingIds.has(t.id))
  if (missing.length === 0) return

  const { error: insertError } = await supabase.from('todos').insert(
    missing.map((t) => ({
      user_id: userId,
      subject_id: t.subject_id,
      title: t.title,
      estimated_minutes: t.estimated_minutes,
      due_date: date,
      recurring_task_id: t.id,
    })),
  )
  if (insertError) throw insertError
}

/** habit 그리드의 칸을 클릭했을 때: 그 날짜 행이 없으면 만들면서 완료 처리하고,
 * 있으면 완료 상태를 뒤집는다. */
export async function toggleHabitDay(recurringTaskId: string, date: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data: existing, error: existingError } = await supabase
    .from('todos')
    .select('id, is_done')
    .eq('recurring_task_id', recurringTaskId)
    .eq('due_date', date)
    .maybeSingle()
  if (existingError) throw existingError

  if (existing) {
    const { error } = await supabase
      .from('todos')
      .update({ is_done: !existing.is_done, completed_at: !existing.is_done ? new Date().toISOString() : null })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { data: task, error: taskError } = await supabase
    .from('recurring_tasks')
    .select('subject_id, title, estimated_minutes')
    .eq('id', recurringTaskId)
    .single()
  if (taskError) throw taskError

  const { error } = await supabase.from('todos').insert({
    user_id: userData.user.id,
    subject_id: task.subject_id,
    title: task.title,
    estimated_minutes: task.estimated_minutes,
    due_date: date,
    recurring_task_id: recurringTaskId,
    is_done: true,
    completed_at: new Date().toISOString(),
  })
  if (error) throw error
}

export interface HabitGridData {
  tasks: RecurringTaskRow[]
  /** key: `${recurringTaskId}|${date}` -> 완료 여부 */
  doneByCell: Map<string, boolean>
}

export async function getHabitGrid(fromDate: string, toDate?: string): Promise<HabitGridData> {
  let instancesQuery = supabase
    .from('todos')
    .select('recurring_task_id, due_date, is_done')
    .not('recurring_task_id', 'is', null)
    .gte('due_date', fromDate)
  if (toDate) instancesQuery = instancesQuery.lte('due_date', toDate)

  const [{ data: tasks, error: tasksError }, { data: instances, error: instancesError }] = await Promise.all([
    supabase.from('recurring_tasks').select('*').order('created_at', { ascending: true }),
    instancesQuery,
  ])

  if (tasksError) throw tasksError
  if (instancesError) throw instancesError

  const doneByCell = new Map<string, boolean>()
  for (const row of instances ?? []) {
    doneByCell.set(`${row.recurring_task_id}|${row.due_date}`, Boolean(row.is_done))
  }

  return { tasks: tasks ?? [], doneByCell }
}
