import { supabase } from '@/lib/supabase'
import type { UserSettingsRow } from '@/types/database'

export async function getUserSettings(): Promise<UserSettingsRow> {
  const { data, error } = await supabase.from('user_settings').select('*').single()
  if (error) throw error
  return data
}

export async function updateUserSettings(
  patch: Partial<
    Pick<
      UserSettingsRow,
      | 'focus_minutes'
      | 'break_minutes'
      | 'long_break_minutes'
      | 'sessions_until_long_break'
      | 'share_screen_time'
    >
  >,
): Promise<UserSettingsRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { data, error } = await supabase
    .from('user_settings')
    .update(patch)
    .eq('user_id', userData.user.id)
    .select('*')
    .single()

  if (error) throw error
  return data
}
