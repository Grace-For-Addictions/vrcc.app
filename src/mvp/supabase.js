// Supabase client for the GFA VRCC MVP — points at the v6 project (GRAVRCC_v6).
// The publishable (anon) key is public-by-design; row-level security governs access.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ykykeioydvtxpyreshhs.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_9NOklH5Dvj3PcQs2dCLdpg_zx4txe8a';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const PROJECT_REF = 'ykykeioydvtxpyreshhs';
