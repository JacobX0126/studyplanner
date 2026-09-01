import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * true if .env.local has real Supabase values. main.tsx checks this before
 * rendering the app and shows a setup screen instead — this file must not
 * throw at import time, or the whole page goes blank with no on-screen hint.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
)
