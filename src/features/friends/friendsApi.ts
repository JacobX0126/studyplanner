import { supabase } from '@/lib/supabase'
import { weekStart } from '@/lib/date'
import type { FriendRequestRow, FriendSummary, ProfileRow } from '@/types/database'

export async function getMyProfile(): Promise<ProfileRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single()
  if (error) throw error
  return data
}

export async function sendFriendRequest(friendCode: string): Promise<void> {
  const { error } = await supabase.rpc('send_friend_request', { p_friend_code: friendCode.trim() })
  if (error) throw error
}

export async function respondFriendRequest(requestId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_friend_request', { p_request_id: requestId, p_accept: accept })
  if (error) throw error
}

export async function removeFriend(friendId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friend', { p_friend_id: friendId })
  if (error) throw error
}

export interface FriendRequestWithName extends FriendRequestRow {
  otherDisplayName: string
}

/** friend_requests는 auth.users만 참조하고 있어 profiles와 직접 FK로 이어지지 않는다.
 * PostgREST 자동 임베드 대상이 아니므로, 요청과 이름을 각각 조회해 클라이언트에서 합친다. */
async function attachNames(
  requests: FriendRequestRow[],
  key: 'requester_id' | 'addressee_id',
): Promise<FriendRequestWithName[]> {
  if (requests.length === 0) return []

  const ids = requests.map((r) => r[key])
  const { data: profiles, error } = await supabase.from('profiles').select('id, display_name').in('id', ids)
  if (error) throw error

  const nameById = new Map((profiles ?? []).map((p) => [p.id as string, p.display_name as string]))
  return requests.map((r) => ({ ...r, otherDisplayName: nameById.get(r[key]) ?? 'Unknown' }))
}

export async function listIncomingRequests(): Promise<FriendRequestWithName[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('addressee_id', userData.user.id)
    .eq('status', 'pending')

  if (error) throw error
  return attachNames(data ?? [], 'requester_id')
}

export async function listOutgoingRequests(): Promise<FriendRequestWithName[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('requester_id', userData.user.id)
    .eq('status', 'pending')

  if (error) throw error
  return attachNames(data ?? [], 'addressee_id')
}

export async function listFriendsSummary(): Promise<FriendSummary[]> {
  const { data, error } = await supabase.rpc('get_friends_summary')
  if (error) throw error
  return data ?? []
}

/** 이번 주 딴짓 버튼 횟수. daily_stats는 이미 친구에게 공개되는 집계 테이블이라
 * 스키마 변경 없이 그대로 조회할 수 있다. */
export async function getWeeklyDistractions(friendIds: string[]): Promise<Map<string, number>> {
  if (friendIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('daily_stats')
    .select('user_id, distraction_count')
    .in('user_id', friendIds)
    .gte('study_date', weekStart())

  if (error) throw error

  const totals = new Map<string, number>()
  for (const row of data ?? []) {
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.distraction_count)
  }
  return totals
}
