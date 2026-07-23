// src/lib/supabaseClient.js — wired to the LIVE Grace For Addictions project.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://ykykeioydvtxpyreshhs.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9NOklH5Dvj3PcQs2dCLdpg_zx4txe8a';

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/**
 * Identity in this system:
 *  - auth user (email) → public.participants row (participants.email)
 *  - role via rpc get_my_role() → 'participant' | 'coach' | 'admin'
 *  - coaches are identified by email (mvp_* tables are email-keyed)
 */
export async function getMyIdentity() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: role }, { data: participant }] = await Promise.all([
    supabase.rpc('get_my_role'),
    supabase.from('participants')
      .select('participant_id, first_name, last_name, preferred_name, county, assigned_coach_email, assigned_coach_name, icare_phase')
      .eq('email', user.email).maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email,
    role: role || 'participant',
    participant: participant || null,
    displayName: participant?.preferred_name || participant?.first_name || user.email,
  };
}
