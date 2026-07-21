import { createClient } from '@supabase/supabase-js';

// Grace House shares the VRCC Supabase project (gfa_* schemas). RLS governs access.
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://ykykeioydvtxpyreshhs.supabase.co';
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  db: { schema: 'gfa_residence' },
});
export const PROJECT_REF = 'ykykeioydvtxpyreshhs';
