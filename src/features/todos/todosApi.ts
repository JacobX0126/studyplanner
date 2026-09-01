import { supabase } from '@/lib/supabase'
import type { TodoRow } from '@/types/database'

export interface TodoWithSubject extends TodoRow {
  subjects: { name: string; color: string } | null
  actual_seconds: number
}

export async function listTodos(): Promise<TodoWithSubject[]> {
  const [{ data: todos, error: todosError }, { data: actuals, error: actualsError }] =
    await Promise.all([
      supabase
        .from('todos')
        .select('*, subjects(name, color)')
        .order('is_done', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true }),
      supabase.from('v_todo_time').select('todo_id, actual_seconds'),
    ])

  if (todosError) throw todosError
  if (actualsError) throw actualsError

  const actualByTodo = new Map((actuals ?? []).map((a) => [a.todo_id as string, a.actual_seconds as number]))

  return (todos ?? []).map((t) => ({
    ...t,
    actual_seconds: actualByTodo.get(t.id) ?? 0,
  }))
}

export interface CreateTodoInput {
  title: string
  subject_id: string | null
  exam_id?: string | null
  due_date: string | null
  estimated_minutes: number | null
}

export async function createTodo(input: CreateTodoInput): Promise<TodoRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('todos')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateTodoTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('todos').update({ title }).eq('id', id)
  if (error) throw error
}

export async function toggleTodoDone(id: string, isDone: boolean): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .update({ is_done: isDone, completed_at: isDone ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) throw error
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) throw error
}

export async function clearCompletedTodos(): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('is_done', true)
  if (error) throw error
}
