import { createClient } from '@supabase/supabase-js';

// Same backend the production app targets. The anon (publishable) key is public
// by design; supply it via env for real requests. Falls back to the project URL
// so the client constructs even without env (skeleton renders offline).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ykykeioydvtxpyreshhs.supabase.co';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const isConfigured = () => Boolean(anon);
