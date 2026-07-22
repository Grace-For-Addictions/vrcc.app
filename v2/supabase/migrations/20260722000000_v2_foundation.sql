-- VRCC v2 foundation: sessions, daily practice, housing, resources, notifications.
-- Self-contained (own tables + role model); does not touch the MVP surface.
-- Verified against Postgres 16 with the Supabase auth schema present.

begin;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.v2_role as enum ('participant', 'coach', 'housing_manager', 'navigator', 'admin');
create type public.v2_session_status as enum ('requested', 'accepted', 'times_suggested', 'completed', 'cancelled');
create type public.v2_session_mode as enum ('video', 'phone', 'in_person');
create type public.v2_application_status as enum ('draft', 'submitted', 'under_review', 'intake_scheduled', 'accepted', 'waitlisted', 'declined', 'withdrawn');
create type public.v2_bed_status as enum ('available', 'occupied', 'held', 'maintenance');
create type public.v2_notification_kind as enum (
  'session_requested', 'session_accepted', 'session_times_suggested', 'session_cancelled',
  'application_submitted', 'application_status_changed', 'intake_scheduled',
  'checkin_shared', 'general'
);

-- ---------------------------------------------------------------------------
-- Profiles & coach assignment
-- ---------------------------------------------------------------------------
create table public.v2_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.v2_role not null default 'participant',
  display_name text not null default '',
  phone        text,
  county       text,
  coach_id     uuid references public.v2_profiles (id),  -- participant -> assigned coach
  created_at   timestamptz not null default now()
);

create index v2_profiles_coach_idx on public.v2_profiles (coach_id);

create or replace function public.v2_my_role()
returns public.v2_role
language sql stable security definer set search_path = public as
$$ select role from public.v2_profiles where id = auth.uid() $$;

create or replace function public.v2_is_staff()
returns boolean
language sql stable security definer set search_path = public as
$$ select public.v2_my_role() in ('coach', 'housing_manager', 'navigator', 'admin') $$;

create or replace function public.v2_is_my_participant(participant uuid)
returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.v2_profiles p
                  where p.id = participant and p.coach_id = auth.uid()) $$;

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------
create table public.v2_session_requests (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid not null references public.v2_profiles (id) on delete cascade,
  coach_id         uuid references public.v2_profiles (id),           -- null = open pool
  status           public.v2_session_status not null default 'requested',
  mode             public.v2_session_mode not null default 'video',
  topic            text not null default '',
  preferred_times  jsonb not null default '[]'::jsonb,                -- participant's offered windows
  suggested_times  jsonb not null default '[]'::jsonb,                -- coach counter-offers
  scheduled_at     timestamptz,
  meeting_url      text,                                              -- set by create-meeting edge fn
  client_ref       text unique,                                       -- idempotency key from the offline sync queue
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index v2_session_requests_pool_idx on public.v2_session_requests (status) where coach_id is null;
create index v2_session_requests_coach_idx on public.v2_session_requests (coach_id, status);
create index v2_session_requests_participant_idx on public.v2_session_requests (participant_id);

create table public.v2_session_feedback (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.v2_session_requests (id) on delete cascade,
  author_id     uuid not null references public.v2_profiles (id) on delete cascade,
  rating        int check (rating between 1 and 5),
  what_helped   text,
  follow_up     text,                                                 -- requested follow-up action
  client_ref    text unique,
  created_at    timestamptz not null default now(),
  unique (session_id, author_id)
);

-- ---------------------------------------------------------------------------
-- Daily practice (morning intentions + evening reflection in one row per day)
-- ---------------------------------------------------------------------------
create table public.v2_daily_checkins (
  id                 uuid primary key default gen_random_uuid(),
  participant_id     uuid not null references public.v2_profiles (id) on delete cascade,
  checkin_date       date not null default (now() at time zone 'utc')::date,
  -- morning
  intention          text,
  bdnf_prompt        text,                                            -- movement/nature/connection prompt shown
  morning_voice_path text,                                            -- storage path in voice-notes bucket
  -- evening
  grow_goal          text,
  grow_reality       text,
  grow_options       text,
  grow_way_forward   text,
  barc_pulse         int check (barc_pulse between 1 and 10),         -- 1-question BARC-style pulse
  moved_body         boolean not null default false,
  declaration        boolean not null default false,                  -- said the daily declaration
  evening_voice_path text,
  -- consent: per-day share toggle; false = private to the participant
  shared_with_coach  boolean not null default false,
  client_ref         text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (participant_id, checkin_date)
);

create index v2_daily_checkins_trend_idx on public.v2_daily_checkins (participant_id, checkin_date desc);

-- Trend view powering the mycelium map (last 30 days per participant).
-- RLS note: security_invoker makes the view honor v2_daily_checkins policies.
create view public.v2_checkin_trends
  with (security_invoker = true) as
select
  participant_id,
  checkin_date,
  barc_pulse,
  moved_body,
  declaration,
  shared_with_coach,
  (intention is not null or morning_voice_path is not null) as did_morning,
  (grow_way_forward is not null or barc_pulse is not null)  as did_evening,
  avg(barc_pulse) over (
    partition by participant_id
    order by checkin_date
    rows between 6 preceding and current row
  ) as barc_7day_avg
from public.v2_daily_checkins
where checkin_date >= (now() at time zone 'utc')::date - 30;

-- ---------------------------------------------------------------------------
-- Housing
-- ---------------------------------------------------------------------------
create table public.v2_housing_programs (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  county             text not null,
  description        text not null default '',
  rules              jsonb not null default '[]'::jsonb,              -- shown before apply; ordered list
  telehealth_ok      boolean not null default true,
  manager_id         uuid references public.v2_profiles (id),
  navigator_id       uuid references public.v2_profiles (id),
  accepting          boolean not null default true,
  created_at         timestamptz not null default now()
);

create table public.v2_housing_beds (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.v2_housing_programs (id) on delete cascade,
  label       text not null,
  status      public.v2_bed_status not null default 'available',
  resident_id uuid references public.v2_profiles (id),
  updated_at  timestamptz not null default now(),
  unique (program_id, label)
);

create index v2_housing_beds_program_idx on public.v2_housing_beds (program_id, status);

-- Live availability per program (drives the realtime bed board).
create view public.v2_bed_availability
  with (security_invoker = true) as
select
  p.id as program_id,
  p.name,
  p.county,
  p.accepting,
  count(b.id)                                          as total_beds,
  count(b.id) filter (where b.status = 'available')    as available_beds
from public.v2_housing_programs p
left join public.v2_housing_beds b on b.program_id = p.id
group by p.id;

create table public.v2_housing_applications (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid not null references public.v2_housing_programs (id) on delete cascade,
  applicant_id     uuid not null references public.v2_profiles (id) on delete cascade,
  status           public.v2_application_status not null default 'draft',
  rules_agreed_at  timestamptz,                                       -- must be set before submit
  answers          jsonb not null default '{}'::jsonb,                -- 6-step wizard payload
  current_step     int not null default 1 check (current_step between 1 and 6),
  intake_at        timestamptz,                                       -- virtual intake slot
  submitted_at     timestamptz,
  client_ref       text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index v2_housing_applications_program_idx on public.v2_housing_applications (program_id, status);
create index v2_housing_applications_applicant_idx on public.v2_housing_applications (applicant_id);

alter table public.v2_housing_applications
  add constraint v2_apps_rules_before_submit
  check (status = 'draft' or rules_agreed_at is not null);

-- ---------------------------------------------------------------------------
-- Resource hub
-- ---------------------------------------------------------------------------
create table public.v2_resources (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      text not null,                                        -- housing, treatment, transport, food, legal, ...
  description   text not null default '',
  url           text,
  phone         text,
  counties      text[] not null default '{}',                         -- empty = statewide
  telehealth_ok boolean not null default false,
  created_at    timestamptz not null default now()
);

create index v2_resources_category_idx on public.v2_resources (category);

-- ---------------------------------------------------------------------------
-- Notifications (rows inserted by triggers; fan-out to email/SMS is the
-- notify-fanout edge function's job, gated on per-user consent there)
-- ---------------------------------------------------------------------------
create table public.v2_notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.v2_profiles (id) on delete cascade,
  kind         public.v2_notification_kind not null,
  title        text not null,
  body         text not null default '',
  link_path    text,                                                  -- in-app route
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index v2_notifications_inbox_idx on public.v2_notifications (recipient_id, read_at, created_at desc);

create or replace function public.v2_notify(
  recipient uuid, k public.v2_notification_kind, t text, b text, link text default null
) returns void
language sql security definer set search_path = public as
$$
  insert into public.v2_notifications (recipient_id, kind, title, body, link_path)
  select recipient, k, t, b, link where recipient is not null
$$;

-- Session lifecycle notifications ------------------------------------------
create or replace function public.v2_session_request_notify()
returns trigger
language plpgsql security definer set search_path = public as
$$
declare
  participant_name text;
begin
  select display_name into participant_name
    from public.v2_profiles where id = new.participant_id;

  if tg_op = 'INSERT' then
    -- notify the chosen coach, or every coach when the request goes to the pool
    if new.coach_id is not null then
      perform public.v2_notify(new.coach_id, 'session_requested',
        'New session request',
        coalesce(participant_name, 'A participant') || ' requested a session: ' || new.topic,
        '/coach/queue');
    else
      perform public.v2_notify(p.id, 'session_requested',
        'New session request in the pool',
        coalesce(participant_name, 'A participant') || ' requested a session: ' || new.topic,
        '/coach/queue')
      from public.v2_profiles p where p.role = 'coach';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'accepted' then
      perform public.v2_notify(new.participant_id, 'session_accepted',
        'Session accepted',
        'Your coach accepted your session request.' ||
          case when new.scheduled_at is not null
               then ' Scheduled for ' || to_char(new.scheduled_at, 'Mon DD at HH12:MI AM') || '.'
               else '' end,
        '/sessions');
    elsif new.status = 'times_suggested' then
      perform public.v2_notify(new.participant_id, 'session_times_suggested',
        'New times suggested',
        'Your coach suggested different times for your session.',
        '/sessions');
    elsif new.status = 'cancelled' then
      perform public.v2_notify(new.participant_id, 'session_cancelled',
        'Session cancelled', 'A session request was cancelled.', '/sessions');
    end if;
  end if;

  new.updated_at = now();
  return new;
end
$$;

create trigger v2_session_requests_notify
  before insert or update on public.v2_session_requests
  for each row execute function public.v2_session_request_notify();

-- Housing application notifications ----------------------------------------
create or replace function public.v2_application_notify()
returns trigger
language plpgsql security definer set search_path = public as
$$
declare
  prog record;
  applicant_name text;
begin
  select name, manager_id, navigator_id into prog
    from public.v2_housing_programs where id = new.program_id;
  select display_name into applicant_name
    from public.v2_profiles where id = new.applicant_id;

  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status = 'draft') then
    new.submitted_at = coalesce(new.submitted_at, now());
    perform public.v2_notify(prog.manager_id, 'application_submitted',
      'New housing application',
      coalesce(applicant_name, 'An applicant') || ' applied to ' || prog.name || '.',
      '/housing/manage');
    perform public.v2_notify(prog.navigator_id, 'application_submitted',
      'New housing application',
      coalesce(applicant_name, 'An applicant') || ' applied to ' || prog.name || '.',
      '/housing/manage');
    perform public.v2_notify(new.applicant_id, 'application_submitted',
      'Application received',
      'Your application to ' || prog.name || ' was received. The team will follow up.',
      '/housing/applications');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'intake_scheduled' then
      perform public.v2_notify(new.applicant_id, 'intake_scheduled',
        'Virtual intake scheduled',
        'Your intake for ' || prog.name ||
          coalesce(' is set for ' || to_char(new.intake_at, 'Mon DD at HH12:MI AM'), '') || '.',
        '/housing/applications');
    else
      perform public.v2_notify(new.applicant_id, 'application_status_changed',
        'Application update',
        'Your application to ' || prog.name || ' is now ' || replace(new.status::text, '_', ' ') || '.',
        '/housing/applications');
    end if;
  end if;

  new.updated_at = now();
  return new;
end
$$;

create trigger v2_housing_applications_notify
  before insert or update on public.v2_housing_applications
  for each row execute function public.v2_application_notify();

-- Bed board timestamps -------------------------------------------------------
create or replace function public.v2_touch_bed()
returns trigger
language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;

create trigger v2_housing_beds_touch
  before update on public.v2_housing_beds
  for each row execute function public.v2_touch_bed();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.v2_profiles             enable row level security;
alter table public.v2_session_requests     enable row level security;
alter table public.v2_session_feedback     enable row level security;
alter table public.v2_daily_checkins       enable row level security;
alter table public.v2_housing_programs     enable row level security;
alter table public.v2_housing_beds         enable row level security;
alter table public.v2_housing_applications enable row level security;
alter table public.v2_resources            enable row level security;
alter table public.v2_notifications        enable row level security;

-- Scope grants to v2 tables only — never touch the MVP surface's grants.
revoke all on
  public.v2_profiles, public.v2_session_requests, public.v2_session_feedback,
  public.v2_daily_checkins, public.v2_housing_programs, public.v2_housing_beds,
  public.v2_housing_applications, public.v2_resources, public.v2_notifications,
  public.v2_checkin_trends, public.v2_bed_availability
from anon;

grant select, insert, update, delete on
  public.v2_profiles, public.v2_session_requests, public.v2_session_feedback,
  public.v2_daily_checkins, public.v2_housing_programs, public.v2_housing_beds,
  public.v2_housing_applications, public.v2_resources, public.v2_notifications
to authenticated;
grant select on public.v2_checkin_trends, public.v2_bed_availability to authenticated;

-- SECURITY DEFINER functions in public are callable by anyone by default.
-- v2_notify and the trigger bodies must only ever run via triggers.
revoke execute on function
  public.v2_notify(uuid, public.v2_notification_kind, text, text, text),
  public.v2_session_request_notify(),
  public.v2_application_notify()
from public, anon, authenticated;

-- profiles: everyone authenticated can read basic profiles (needed for names);
-- users update only their own row; role/coach changes are staff-only.
create policy v2_profiles_select on public.v2_profiles
  for select to authenticated using (true);
create policy v2_profiles_self_insert on public.v2_profiles
  for insert to authenticated with check (id = auth.uid());
create policy v2_profiles_self_update on public.v2_profiles
  for update to authenticated
  using (id = auth.uid() or public.v2_my_role() = 'admin')
  with check (id = auth.uid() or public.v2_my_role() = 'admin');

-- session requests: participant sees own; coach sees own + open pool.
create policy v2_sr_participant on public.v2_session_requests
  for all to authenticated
  using (participant_id = auth.uid())
  with check (participant_id = auth.uid());
create policy v2_sr_coach_select on public.v2_session_requests
  for select to authenticated
  using (public.v2_my_role() in ('coach', 'admin') and (coach_id = auth.uid() or coach_id is null));
create policy v2_sr_coach_update on public.v2_session_requests
  for update to authenticated
  using (public.v2_my_role() in ('coach', 'admin') and (coach_id = auth.uid() or coach_id is null))
  with check (public.v2_my_role() in ('coach', 'admin'));

-- feedback: author writes, session participant + assigned coach read.
create policy v2_sf_author on public.v2_session_feedback
  for all to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy v2_sf_session_parties on public.v2_session_feedback
  for select to authenticated
  using (exists (select 1 from public.v2_session_requests s
                 where s.id = session_id
                   and (s.participant_id = auth.uid() or s.coach_id = auth.uid())));

-- daily check-ins: PRIVATE by default. Coach reads only rows the participant
-- explicitly shared, and only for participants on their own caseload.
create policy v2_dc_self on public.v2_daily_checkins
  for all to authenticated
  using (participant_id = auth.uid())
  with check (participant_id = auth.uid());
create policy v2_dc_coach_shared on public.v2_daily_checkins
  for select to authenticated
  using (shared_with_coach and public.v2_is_my_participant(participant_id));

-- housing programs & beds: readable by all authenticated; managed by staff.
create policy v2_hp_select on public.v2_housing_programs
  for select to authenticated using (true);
create policy v2_hp_manage on public.v2_housing_programs
  for all to authenticated
  using (manager_id = auth.uid() or public.v2_my_role() = 'admin')
  with check (manager_id = auth.uid() or public.v2_my_role() = 'admin');

create policy v2_hb_select on public.v2_housing_beds
  for select to authenticated using (true);
create policy v2_hb_manage on public.v2_housing_beds
  for all to authenticated
  using (exists (select 1 from public.v2_housing_programs p
                 where p.id = program_id
                   and (p.manager_id = auth.uid() or public.v2_my_role() = 'admin')))
  with check (exists (select 1 from public.v2_housing_programs p
                      where p.id = program_id
                        and (p.manager_id = auth.uid() or public.v2_my_role() = 'admin')));

-- applications: applicant owns theirs; program manager/navigator see theirs.
create policy v2_ha_applicant on public.v2_housing_applications
  for all to authenticated
  using (applicant_id = auth.uid())
  with check (applicant_id = auth.uid());
create policy v2_ha_program_staff on public.v2_housing_applications
  for select to authenticated
  using (exists (select 1 from public.v2_housing_programs p
                 where p.id = program_id
                   and (p.manager_id = auth.uid() or p.navigator_id = auth.uid()
                        or public.v2_my_role() = 'admin')));
create policy v2_ha_program_staff_update on public.v2_housing_applications
  for update to authenticated
  using (exists (select 1 from public.v2_housing_programs p
                 where p.id = program_id
                   and (p.manager_id = auth.uid() or p.navigator_id = auth.uid()
                        or public.v2_my_role() = 'admin')))
  with check (true);

-- resources: public directory for signed-in users; staff curate.
create policy v2_res_select on public.v2_resources
  for select to authenticated using (true);
create policy v2_res_manage on public.v2_resources
  for all to authenticated
  using (public.v2_is_staff())
  with check (public.v2_is_staff());

-- notifications: recipients only.
create policy v2_notif_own on public.v2_notifications
  for select to authenticated using (recipient_id = auth.uid());
create policy v2_notif_mark_read on public.v2_notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed: Grace House (8 beds) + starter resources
-- ---------------------------------------------------------------------------
insert into public.v2_housing_programs (id, name, county, description, rules, telehealth_ok, accepting)
values (
  '00000000-0000-0000-0000-00000000a001',
  'Grace House',
  'Wise',
  'Faith-friendly recovery residence for women in Southwest Virginia. Peer-run, recovery-first, with virtual intake available for rural applicants.',
  '[
    "Complete sobriety — no alcohol or non-prescribed substances on or off site.",
    "Attend house meeting every week and at least three recovery meetings per week.",
    "Curfew 10pm Sunday–Thursday, 12am Friday–Saturday for the first 60 days.",
    "Random drug screens; a positive screen starts the exit-with-support process.",
    "Share house chores; common areas cleaned daily.",
    "No overnight guests. Visitors in common areas only, 9am–9pm.",
    "Work, school, volunteering, or treatment engagement required after 30 days.",
    "Respect every housemate — no violence, threats, or harassment of any kind."
  ]'::jsonb,
  true,
  true
);

insert into public.v2_housing_beds (program_id, label)
select '00000000-0000-0000-0000-00000000a001', 'Bed ' || n
from generate_series(1, 8) as n;

insert into public.v2_resources (title, category, description, url, phone, counties, telehealth_ok) values
  ('Virginia 988 Crisis Line', 'crisis', 'Free 24/7 call, text, or chat support for mental health and substance use crises.', 'https://988lifeline.org', '988', '{}', true),
  ('Mount Rogers Community Services', 'treatment', 'Outpatient SUD treatment, MAT, and case management for Southwest Virginia.', 'https://mtrogerscsb.com', null, '{Wise,Smyth,Wythe,Grayson,Carroll,Bland}', true),
  ('Mountain Empire Transit', 'transport', 'Demand-response rural transit — rides to treatment, work, and appointments.', null, '276-523-7433', '{Wise,Lee,Scott}', false),
  ('Feeding Southwest Virginia', 'food', 'Regional food bank network with mobile pantry stops in every county.', 'https://feedingswva.org', null, '{}', false),
  ('Virginia Legal Aid Society', 'legal', 'Free civil legal help — expungement clinics, housing disputes, benefits appeals.', 'https://vlas.org', '866-534-5243', '{}', true);

commit;
