import { supabase } from '@/lib/supabase'

export interface DayCompletion {
  date: string
  total: number
  done: number
}

/** 이 기간(달이든 1년이든)에 마감일이 있는 투두를 날짜별로 묶어서 완료율을 계산한다.
 * 새 테이블 없이 기존 todos.due_date/is_done만으로 계산 — 플래너와 투두는 같은 데이터다. */
export async function getRangeCompletion(rangeStart: string, rangeEnd: string): Promise<DayCompletion[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('due_date, is_done')
    .gte('due_date', rangeStart)
    .lte('due_date', rangeEnd)
    .not('due_date', 'is', null)

  if (error) throw error

  const byDate = new Map<string, DayCompletion>()
  for (const row of data ?? []) {
    const date = row.due_date as string
    const entry = byDate.get(date) ?? { date, total: 0, done: 0 }
    entry.total += 1
    if (row.is_done) entry.done += 1
    byDate.set(date, entry)
  }

  return Array.from(byDate.values())
}
