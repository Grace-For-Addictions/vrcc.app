import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Missing keys fall back to a harmless placeholder so the app shell (and the
// offline queue) still load; real data features surface a setup notice.
export const isConfigured = Boolean(url && anonKey)

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

export async function currentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('v2_profiles').select('*').eq('id', user.id).single()
  return data ? { ...data, email: user.email } : { id: user.id, email: user.email, role: 'participant', display_name: '' }
}
