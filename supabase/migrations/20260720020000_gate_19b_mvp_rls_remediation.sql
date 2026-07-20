-- Gate 19B — RLS remediation for the VRCC MVP surface.
-- APPLIED to ykykeioydvtxpyreshhs as migration `gate_19b_mvp_rls_remediation`
-- and verified live (see docs/gate-19a-launch-readiness-report.md).
--
-- Fixes: (1) participant_intakes, barc10_assessments, mvp_sessions,
-- mvp_session_requests, mvp_messages had RLS ENABLED but no policies => deny-all
-- (onboarding writes blocked; 16 signups, 0 intakes). (2) legacy public.* tables
-- exposed org-wide authenticated reads.

-- Least privilege: pre-login (anon) should never reach these tables.
revoke all on public.participant_intakes, public.barc10_assessments,
               public.mvp_sessions, public.mvp_session_requests,
               public.mvp_messages
  from anon;

-- participant_intakes
create policy pi_self_select on public.participant_intakes for select to authenticated
  using (lower(email) = lower(auth.jwt()->>'email'));
create policy pi_self_insert on public.participant_intakes for insert to authenticated
  with check (lower(email) = lower(auth.jwt()->>'email'));
create policy pi_coach_select on public.participant_intakes for select to authenticated
  using (participant_id in (select my_assigned_participant_ids()));
create policy pi_admin_all on public.participant_intakes for all to authenticated
  using (is_admin()) with check (is_admin());

-- barc10_assessments
create policy b10_self_select on public.barc10_assessments for select to authenticated
  using (lower(created_by) = lower(auth.jwt()->>'email'));
create policy b10_self_insert on public.barc10_assessments for insert to authenticated
  with check (lower(created_by) = lower(auth.jwt()->>'email'));
create policy b10_coach_select on public.barc10_assessments for select to authenticated
  using (participant_id in (select my_assigned_participant_ids()));
create policy b10_admin_all on public.barc10_assessments for all to authenticated
  using (is_admin()) with check (is_admin());

-- mvp_sessions (mvp_sessions_coach_update already exists for UPDATE)
create policy ms_participant_select on public.mvp_sessions for select to authenticated
  using (lower(participant_email) = lower(auth.jwt()->>'email'));
create policy ms_coach_select on public.mvp_sessions for select to authenticated
  using (lower(coach_email) = lower(auth.jwt()->>'email'));
create policy ms_coach_insert on public.mvp_sessions for insert to authenticated
  with check (lower(coach_email) = lower(auth.jwt()->>'email'));
create policy ms_admin_all on public.mvp_sessions for all to authenticated
  using (is_admin()) with check (is_admin());

-- mvp_session_requests
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

-- mvp_messages (1:1 participant<->coach thread)
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

-- Close org-wide read on the empty legacy public.* duplicates.
drop policy if exists org_read_outcomes         on public.outcomes;
drop policy if exists org_read_icare_plans       on public.icare_plans;
drop policy if exists org_read_referrals         on public.resource_referrals;
drop policy if exists org_read_peer_circles      on public.peer_circles;
drop policy if exists org_read_slogan_practices  on public.slogan_practices;
