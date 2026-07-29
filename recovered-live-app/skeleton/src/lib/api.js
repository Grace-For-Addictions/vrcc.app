import { supabase } from './supabase';

// Schema-scoped table accessors — mirrors the schemas the production bundle uses
// (see ../../analysis/data-model.md). gfa_ui is the primary surface (124 calls live).
export const ui = (table) => supabase.schema('gfa_ui').from(table);
export const core = (table) => supabase.schema('gfa_core').from(table);
export const engagement = (table) => supabase.schema('gfa_engagement').from(table);
export const community = (table) => supabase.schema('gfa_community').from(table);
export const residence = (table) => supabase.schema('gfa_residence').from(table);
export const icare = (table) => supabase.schema('gfa_icare').from(table);
export const personality = (table) => supabase.schema('gfa_personality').from(table);

// RPCs the production app calls. Param names are best-effort and should be
// confirmed against pg_proc before relying on them (marked where uncertain).
export const rpc = {
  getMyRole: () => supabase.rpc('get_my_role'),
  getLookup: (name) => supabase.rpc('get_lookup', { p_lookup: name }), // confirm arg name
  myParticipantId: () => supabase.rpc('my_core_participant_id'),
  myCoachId: () => supabase.rpc('my_core_coach_id'),
  materializeBookingRequest: (args) => supabase.rpc('materialize_booking_request', args),
  provisionCoachFromAccessRequest: (args) => supabase.rpc('provision_coach_from_access_request', args),
  adminGetAllUsers: () => supabase.rpc('admin_get_all_users'),
  adminSetRole: (args) => supabase.rpc('admin_set_role', args),
};
