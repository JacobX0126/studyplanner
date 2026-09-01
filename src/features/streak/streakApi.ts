import { supabase } from '@/lib/supabase'
import { weekStart } from '@/lib/date'
import type { DailyStatsRow, StreakRow } from '@/types/database'

export async function getStreak(): Promise<StreakRow> {
  const { data, error } = await supabase.from('streaks').select('*').single()
  if (error) throw error
  return data
}

/** 이번 주에 이미 소모된 휴식권 개수. 스트릭 트리거가 갭을 메울 때 자동으로 쌓는다. */
export async function getRestPassesUsedThisWeek(): Promise<number> {
  const { count, error } = await supabase
    .from('rest_passes')
    .select('id', { count: 'exact', head: true })
    .eq('week_start', weekStart())

  if (error) throw error
  return count ?? 0
}

export async function getGrassCalendar(fromDate: string): Promise<DailyStatsRow[]> {
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .gte('study_date', fromDate)
    .order('study_date', { ascending: true })

  if (error) throw error
  return data
}
