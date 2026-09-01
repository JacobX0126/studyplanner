import { supabase } from '@/lib/supabase'
import { weekStart } from '@/lib/date'
import type { ScreenTimeEntryRow } from '@/types/database'

export async function getMyScreenTime(week: string = weekStart()): Promise<ScreenTimeEntryRow | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('screen_time_entries')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('week_start', week)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertMyScreenTime(minutes: number, week: string = weekStart()): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { error } = await supabase.from('screen_time_entries').upsert({
    user_id: userData.user.id,
    week_start: week,
    minutes,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

/** 공유를 켠 친구의 행만 RLS를 통해 돌아온다 — 안 켠 친구는 조용히 빠진다. */
export async function getFriendsScreenTime(
  friendIds: string[],
  week: string = weekStart(),
): Promise<Map<string, number>> {
  if (friendIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('screen_time_entries')
    .select('user_id, minutes')
    .in('user_id', friendIds)
    .eq('week_start', week)

  if (error) throw error
  return new Map((data ?? []).map((row) => [row.user_id as string, row.minutes as number]))
}
