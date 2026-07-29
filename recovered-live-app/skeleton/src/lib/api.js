import { supabase } from './supabase';

// Schema-scoped table accessors — mirrors the schemas the production bundle uses
// (see ../../analysis/data-model.md). gfa_ui is the primary surface (124 calls live).
export const ui = (table) => supabase.schema('gfa_ui').from(table);
export const core = (table) => supabase.schema('gfa_core').from(table);
export const engagement = (table) => supabase.schema('gfa_engagement').from(table);
export const community = (table) => supabase.schema('gfa_community').from(table);
export const residence = (table) => supabase.schema('gfa_residence').from(table);
export const icareSchema = (table) => supabase.schema('gfa_icare').from(table);
export const personality = (table) => supabase.schema('gfa_personality').from(table);

// RPCs the production app calls. Signatures confirmed against pg_proc.
export const rpc = {
  getMyRole: () => supabase.rpc('get_my_role'),                              // () -> text
  getLookup: (table_name) => supabase.rpc('get_lookup', { table_name }),     // (table_name text) -> rows
  myCoreParticipantId: () => supabase.rpc('my_core_participant_id'),         // () -> integer (gfa_core id)
  myCoreCoachId: () => supabase.rpc('my_core_coach_id'),
  materializeBookingRequest: (args) => supabase.rpc('materialize_booking_request', args),
  provisionCoachFromAccessRequest: (args) => supabase.rpc('provision_coach_from_access_request', args),
  adminGetAllUsers: () => supabase.rpc('admin_get_all_users'),
  adminSetRole: (args) => supabase.rpc('admin_set_role', args),
};

// --- Identity ---------------------------------------------------------------
// gfa_ui tables key on a uuid participant_id; gfa_core uses an integer id. There
// is no uuid-returning RPC — the app resolves identity from participant_profiles
// (id uuid = the gfa_ui participant, user_id = auth.uid, core_participant_id bridges
// to gfa_core). This returns the whole crosswalk for the signed-in user.
export async function getAuthUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function getMyProfile() {
  const user = await getAuthUser();
  if (!user) return { user: null, profile: null };
  const { data, error } = await ui('participant_profiles')
    .select('id, user_id, supabase_participant_id, core_participant_id, assigned_coach_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return { user, profile: data };
}
