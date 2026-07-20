-- ============================================================================
-- RLS remediation for the VRCC MVP surface.
-- *** APPLIED 2026-07-20 to ykykeioydvtxpyreshhs as migration
--     `gate_19b_mvp_rls_remediation`, and VERIFIED (see gate-19a report). ***
-- In-repo copy: supabase/migrations/20260720020000_gate_19b_mvp_rls_remediation.sql
-- ============================================================================
-- Fixes two findings from Gate 19A security verification:
--
-- (1) LAUNCH BLOCKER — participant_intakes, barc10_assessments, mvp_sessions,
--     mvp_session_requests, mvp_messages have RLS ENABLED but NO row policies
--     => deny-all for authenticated users. Evidence: 16 participants signed up
--     but 0 intakes / 0 BARC-10 / 0 sessions / 0 messages — onboarding's first
--     insert is denied. These tables also carry over-broad grants to `anon`.
--
-- (2) LATENT EXPOSURE — public.{outcomes,icare_plans,resource_referrals,
--     peer_circles,slogan_practices} grant org-wide SELECT to any authenticated
--     user (USING org_id='gfa'). Currently 0 rows, but they hold participant
--     columns; the correctly-scoped copies live in gfa_*.  Close the org-wide
--     read before these are populated.
--
-- Review predicates against your auth model before applying. Test with a real
-- participant AND coach JWT. Reuses existing helpers (is_admin(), is_coach(),
-- my_assigned_participant_ids()) already used by the participants policies.
-- ============================================================================

begin;

-- Least privilege: pre-login (anon) should never reach these tables.
revoke all on public.participant_intakes, public.barc10_assessments,
               public.mvp_sessions, public.mvp_session_requests,
               public.mvp_messages
  from anon;

-- ---- participant_intakes (cols: participant_id, email, created_by) --------
create policy pi_self_select on public.participant_intakes for select to authenticated
  using (lower(email) = lower(auth.jwt()->>'email'));
create policy pi_self_insert on public.participant_intakes for insert to authenticated
  with check (lower(email) = lower(auth.jwt()->>'email'));
create policy pi_coach_select on public.participant_intakes for select to authenticated
  using (participant_id in (select my_assigned_participant_ids()));
create policy pi_admin_all on public.participant_intakes for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---- barc10_assessments (cols: participant_id, created_by) ----------------
create policy b10_self_select on public.barc10_assessments for select to authenticated
  using (lower(created_by) = lower(auth.jwt()->>'email'));
create policy b10_self_insert on public.barc10_assessments for insert to authenticated
  with check (lower(created_by) = lower(auth.jwt()->>'email'));
create policy b10_coach_select on public.barc10_assessments for select to authenticated
  using (participant_id in (select my_assigned_participant_ids()));
create policy b10_admin_all on public.barc10_assessments for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---- mvp_sessions (participant_email, coach_email; UPDATE policy exists) ---
create policy ms_participant_select on public.mvp_sessions for select to authenticated
  using (lower(participant_email) = lower(auth.jwt()->>'email'));
create policy ms_coach_select on public.mvp_sessions for select to authenticated
  using (lower(coach_email) = lower(auth.jwt()->>'email'));
create policy ms_coach_insert on public.mvp_sessions for insert to authenticated
  with check (lower(coach_email) = lower(auth.jwt()->>'email'));
create policy ms_admin_all on public.mvp_sessions for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---- mvp_session_requests (participant_email, coach_email) -----------------
create policy msr_participant_select on public.mvp_session_requests for select to authenticated
  using (lower(participant_email) = lower(auth.jwt()->>'email'));
create policy msr_participant_insert on public.mvp_session_requests for insert to authenticated
  with check (lower(participant_email) = lower(auth.jwt()->>'email'));
create policy msr_coach_select on public.mvp_session_requests for select to authenticated
  using (lower(coach_email) = lower(auth.jwt()->>'email'));
create policy msr_coach_update on public.mvp_session_requests for update to authenticated
  using (lower(coach_email) = lower(auth.jwt()->>'email'))
  with check (lower(coach_email) = lower(auth.jwt()->>'email'));
create policy msr_admin_all on public.mvp_session_requests for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---- mvp_messages (1:1 participant<->coach thread) ------------------------
create policy mm_participant_select on public.mvp_messages for select to authenticated
  using (lower(participant_email) = lower(auth.jwt()->>'email'));
create policy mm_participant_insert on public.mvp_messages for insert to authenticated
  with check (sender_role = 'participant'
              and lower(sender_email) = lower(auth.jwt()->>'email')
              and lower(participant_email) = lower(auth.jwt()->>'email'));
create policy mm_coach_select on public.mvp_messages for select to authenticated
  using (participant_email in (
    select email from public.participants
    where lower(assigned_coach_email) = lower(auth.jwt()->>'email')));
create policy mm_coach_insert on public.mvp_messages for insert to authenticated
  with check (sender_role = 'coach'
              and lower(sender_email) = lower(auth.jwt()->>'email')
              and participant_email in (
                select email from public.participants
                where lower(assigned_coach_email) = lower(auth.jwt()->>'email')));
create policy mm_admin_all on public.mvp_messages for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---- (2) close org-wide read on the empty legacy public.* duplicates ------
drop policy if exists org_read_outcomes         on public.outcomes;
drop policy if exists org_read_icare_plans       on public.icare_plans;
drop policy if exists org_read_referrals         on public.resource_referrals;
drop policy if exists org_read_peer_circles      on public.peer_circles;
drop policy if exists org_read_slogan_practices  on public.slogan_practices;
-- If these tables will be used, add participant-own + staff policies mirroring
-- gfa_icare/gfa_community/gfa_ui. If they are dead base44-era duplicates,
-- prefer DROP TABLE after confirming nothing writes them.

commit;

-- POST-APPLY TESTS (run as real JWTs, not service_role):
--   * Participant can complete intake + BARC-10 (inserts succeed); sees only own
--     rows in mvp_sessions / mvp_session_requests / mvp_messages.
--   * Participant A cannot select B's intake / barc10 / sessions / messages.
--   * Coach sees only assigned participants' sessions/requests/messages; can
--     schedule (insert mvp_sessions) and mark done (update).
--   * Authenticated participant gets 0 rows from public.outcomes etc. (or table
--     dropped).
