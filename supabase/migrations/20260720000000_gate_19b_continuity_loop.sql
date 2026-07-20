-- Gate 19B — continuity-of-connection loop
-- Additive only. No new tables. Apply to project ykykeioydvtxpyreshhs before
-- deploying the matching frontend (branch claude/vrcc-refine).
--
-- Invariant this supports:
--   every participant has a next step;
--   every human follow-up has a due state;
--   every overdue/quiet connection returns to a coach's attention.

begin;

-- 1. Relationship-level rollup on participants — powers the participant home's
--    "Your next step" card and the coach "Needs attention" queue with no joins.
alter table public.participants
  add column if not exists current_next_step   text,
  add column if not exists next_follow_up_due  date,
  add column if not exists last_contact_at     timestamptz;

comment on column public.participants.current_next_step  is 'Gate 19B: agreed next step shown on the participant home.';
comment on column public.participants.next_follow_up_due is 'Gate 19B: date the coach follow-up is due; drives the attention queue.';
comment on column public.participants.last_contact_at    is 'Gate 19B: last meaningful coach contact; drives never-contacted / gone-quiet.';

-- 2. Session-close documentation on mvp_sessions. `status` already exists; the
--    app now also uses the value 'completed'.
alter table public.mvp_sessions
  add column if not exists coach_notes   text,
  add column if not exists next_step     text,
  add column if not exists follow_up_due date;

comment on column public.mvp_sessions.next_step is 'Gate 19B: agreed next step captured at session close.';

-- 3. RLS. Adding columns does NOT change existing row-level policies, so any
--    current coach UPDATE policy already covers the new columns. The blocks
--    below only add a policy when an equivalent one is absent (safe to re-run).
--    Adjust the email claim path if this project keys coaches differently.

-- Coach may update their own assigned participants (rollup writes) and claim
-- unassigned ones. Guard prevents reassigning a participant to another coach.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'participants'
      and cmd = 'UPDATE' and policyname = 'participants_coach_update'
  ) then
    create policy participants_coach_update on public.participants
      for update to authenticated
      using (
        assigned_coach_email = (auth.jwt() ->> 'email')
        or assigned_coach_email is null
      )
      with check (
        assigned_coach_email = (auth.jwt() ->> 'email')
      );
  end if;
end $$;

-- Coach may update sessions they own (mark complete, next step, follow-up).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mvp_sessions'
      and cmd = 'UPDATE' and policyname = 'mvp_sessions_coach_update'
  ) then
    create policy mvp_sessions_coach_update on public.mvp_sessions
      for update to authenticated
      using (coach_email = (auth.jwt() ->> 'email'))
      with check (coach_email = (auth.jwt() ->> 'email'));
  end if;
end $$;

commit;

-- VERIFY AFTER APPLYING (run manually, do not include in the migration):
--   select column_name from information_schema.columns
--     where table_schema='public' and table_name='participants'
--       and column_name in ('current_next_step','next_follow_up_due','last_contact_at');
--   -- RLS negative test: participant JWT cannot update another participant's row;
--   -- coach JWT cannot update a participant outside their caseload.
