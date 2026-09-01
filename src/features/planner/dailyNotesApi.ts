import { supabase } from '@/lib/supabase'
import type { DailyNoteRow } from '@/types/database'

export async function getDailyNote(date: string): Promise<DailyNoteRow | null> {
  const { data, error } = await supabase.from('daily_notes').select('*').eq('note_date', date).maybeSingle()
  if (error) throw error
  return data
}

export async function saveDailyNote(date: string, content: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('You need to be signed in.')

  const { error } = await supabase.from('daily_notes').upsert({
    user_id: userData.user.id,
    note_date: date,
    content,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
