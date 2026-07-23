-- ============================================================================
-- GFA VRCC.app — Quantum Extension Migration
-- 0002_vrcc_quantum_extension.sql
-- Peer/Coach Sessions · Daily Recovery Practices · Resource Hub & Housing
-- "No Fees. No Stigma. Just Grace."
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. ENUMS
-- ---------------------------------------------------------------------------
create type user_role as enum ('participant', 'coach', 'navigator', 'admin');

create type session_type as enum ('peer_support', 'recovery_coach', 'life_coach');

create type session_status as enum (
  'pending',            -- participant submitted, awaiting coach
  'suggested',          -- coach proposed alternate time(s)
  'accepted',           -- time confirmed, meeting link generated
  'declined',           -- coach declined (routed back to pool)
  'completed',
  'cancelled'
);

create type checkin_kind as enum ('morning', 'evening');

create type application_status as enum (
  'draft', 'submitted', 'under_review',
  'intake_scheduled', 'accepted', 'waitlisted', 'declined', 'withdrawn'
);

create type bed_status as enum ('available', 'occupied', 'hold', 'maintenance');

create type notification_channel as enum ('in_app', 'email', 'sms');

-- ---------------------------------------------------------------------------
-- 1. PROFILES (extends auth.users — mirrors/augments existing users table)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text not null default 'Friend',
  role           user_role not null default 'participant',
  pronouns       text,
  county         text,                         -- Iowa rural routing
  is_rural       boolean default false,
  phone          text,
  timezone       text default 'America/Chicago',
  -- consent & communication preferences (all consent-driven)
  allow_email    boolean default false,
  allow_sms      boolean default false,
  coach_bio      text,                         -- for coach role
  coach_types    session_type[] default '{}',  -- which session types this coach offers
  accepting_requests boolean default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. SESSION REQUESTS (Peer / Recovery Coach / Life Coach)
-- ---------------------------------------------------------------------------
create table session_requests (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid not null references profiles(id) on delete cascade,
  coach_id         uuid references profiles(id) on delete set null,
  session_type     session_type not null,
  status           session_status not null default 'pending',
  topic            text,                       -- optional: what they'd like to explore
  preferred_times  jsonb not null default '[]',-- [{start:"ISO", end:"ISO"}]
  suggested_times  jsonb not null default '[]',-- coach counter-proposals
  scheduled_at     timestamptz,
  duration_min     int not null default 50,
  meeting_provider text default 'zoom',        -- 'zoom' | 'uma'
  meeting_url      text,
  coach_note       text,                       -- visible to participant on suggest/decline
  decline_reason   text,                       -- private to navigators (never shamed)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_session_requests_participant on session_requests(participant_id);
create index idx_session_requests_coach on session_requests(coach_id);
create index idx_session_requests_status on session_requests(status);
create index idx_session_requests_type_status on session_requests(session_type, status);

-- Post-session feedback + follow-up (both directions)
create table session_feedback (
  id                 uuid primary key default gen_random_uuid(),
  session_request_id uuid not null references session_requests(id) on delete cascade,
  author_id          uuid not null references profiles(id) on delete cascade,
  rating             int check (rating between 1 and 5),
  felt_heard         boolean,
  reflection         text,
  follow_up          text,          -- suggestions: resources, next session cadence, etc.
  wants_followup     boolean default false,
  created_at         timestamptz not null default now(),
  unique (session_request_id, author_id)
);

-- ---------------------------------------------------------------------------
-- 3. DAILY RECOVERY PRACTICES (Morning Intentions · Evening Reflections)
-- ---------------------------------------------------------------------------
create table daily_checkins (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  checkin_date       date not null default current_date,
  kind               checkin_kind not null,
  -- Morning
  intention_text     text,
  intention_audio_url text,                    -- voice-first (Supabase Storage)
  movement_prompt    text,                     -- served BDNF prompt
  movement_done      boolean,
  -- Evening (GROW)
  grow_goal          text,
  grow_reality       text,
  grow_options       text,
  grow_will          text,
  barc_pulse         int check (barc_pulse between 1 and 6),  -- quick recovery-capital pulse
  gratitude          text,
  declaration        text,                     -- quantum declaration
  mood               int check (mood between 1 and 5),
  -- Privacy: private by default; consent-based coach visibility
  coach_visible      boolean not null default false,
  offline_synced_at  timestamptz,              -- set when synced from offline queue
  client_uuid        uuid,                     -- idempotency key from PWA offline queue
  created_at         timestamptz not null default now(),
  unique (user_id, checkin_date, kind)
);
create index idx_checkins_user_date on daily_checkins(user_id, checkin_date desc);
create unique index idx_checkins_client_uuid on daily_checkins(client_uuid) where client_uuid is not null;

-- Rolling recovery-capital view for mycelium trend visualization
create or replace view v_recovery_trends as
select
  user_id,
  checkin_date,
  avg(barc_pulse)  filter (where barc_pulse is not null) as barc_avg,
  bool_or(movement_done)                                  as moved,
  count(*) filter (where declaration is not null)         as declarations,
  count(*)                                                as checkin_count
from daily_checkins
group by user_id, checkin_date;

-- ---------------------------------------------------------------------------
-- 4. RESOURCE HUB & RECOVERY HOUSING (Iowa Focus)
-- ---------------------------------------------------------------------------
create table resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null,        -- 'housing' | 'mat' | 'harm_reduction' | 'family' | 'justice' | 'telehealth' | ...
  description text,
  url         text,
  phone       text,
  county      text,                 -- Iowa county for rural filtering
  statewide   boolean default false,
  telehealth  boolean default false,
  tags        text[] default '{}',
  created_at  timestamptz not null default now()
);
create index idx_resources_category on resources(category);
create index idx_resources_county on resources(county);

create table housing_programs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,                 -- e.g. 'Grace House'
  slug           text not null unique,          -- 'grace-house'
  city           text,
  county         text,
  description    text,
  rules          jsonb not null default '[]',   -- [{title, body}] — viewable BEFORE applying
  expectations   jsonb not null default '[]',
  populations    text[] default '{}',           -- 'men','women','mat_friendly','justice_involved',...
  telehealth_priority boolean default true,
  contact_email  text,
  contact_phone  text,
  manager_id     uuid references profiles(id),  -- house manager gets auto-notifications
  total_beds     int not null default 0,
  is_active      boolean default true,
  created_at     timestamptz not null default now()
);

create table housing_beds (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references housing_programs(id) on delete cascade,
  label       text not null,                    -- 'Room 2 · Bed A'
  status      bed_status not null default 'available',
  resident_id uuid references profiles(id) on delete set null,
  notes       text,
  updated_at  timestamptz not null default now(),
  unique (program_id, label)
);
create index idx_beds_program_status on housing_beds(program_id, status);

-- Real-time availability view (drives the public "beds open" indicator)
create or replace view v_bed_availability as
select
  p.id as program_id, p.name, p.slug,
  count(b.id) filter (where b.status = 'available') as beds_available,
  count(b.id)                                        as beds_total
from housing_programs p
left join housing_beds b on b.program_id = p.id
group by p.id;

create table housing_applications (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid not null references housing_programs(id) on delete cascade,
  applicant_id    uuid not null references profiles(id) on delete cascade,
  status          application_status not null default 'draft',
  -- Wizard step payloads
  personal        jsonb not null default '{}', -- {name, dob, phone, county, emergency_contact,...}
  recovery_journey text,                       -- their story, in their words
  your_why        text,                        -- "Your Why" — the heart of the application
  pathway         text,                        -- abstinence | mat | harm_reduction | other (all welcome)
  justice_involved boolean,
  -- Consent (explicit, granular)
  consent_rules_reviewed  boolean not null default false,
  consent_share_with_house boolean not null default false,
  consent_contact_method  notification_channel default 'in_app',
  -- Intake
  intake_at       timestamptz,
  intake_provider text default 'zoom',
  intake_url      text,
  reviewer_id     uuid references profiles(id),
  reviewer_note   text,
  submitted_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_housing_apps_program on housing_applications(program_id, status);
create index idx_housing_apps_applicant on housing_applications(applicant_id);

-- ---------------------------------------------------------------------------
-- 5. NOTIFICATIONS (in-app + optional email/SMS fan-out via Edge Function)
-- ---------------------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        text not null,        -- 'session.requested' | 'session.accepted' | 'housing.submitted' | ...
  title       text not null,
  body        text,
  link        text,                 -- deep link within app
  read_at     timestamptz,
  channels    notification_channel[] not null default '{in_app}',
  created_at  timestamptz not null default now()
);
create index idx_notifications_user_unread on notifications(user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- 6. TRIGGERS — updated_at + auto-notifications (grace in the machinery)
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_touch_session_requests before update on session_requests
  for each row execute function touch_updated_at();
create trigger trg_touch_housing_apps before update on housing_applications
  for each row execute function touch_updated_at();
create trigger trg_touch_profiles before update on profiles
  for each row execute function touch_updated_at();

-- Notify coaches when a session request lands / participant when status changes
create or replace function notify_session_change() returns trigger as $$
declare coach record;
begin
  if (tg_op = 'INSERT') then
    -- fan out to all accepting coaches of this type
    for coach in
      select id from profiles
      where role = 'coach' and accepting_requests
        and new.session_type = any(coach_types)
    loop
      insert into notifications (user_id, kind, title, body, link)
      values (coach.id, 'session.requested',
              'New ' || replace(new.session_type::text, '_', ' ') || ' request',
              'A participant is reaching out. Accept, suggest a time, or pass — only what works for you.',
              '/coach/requests/' || new.id);
    end loop;
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    if new.status = 'accepted' then
      insert into notifications (user_id, kind, title, body, link)
      values (new.participant_id, 'session.accepted', 'Your session is confirmed 🌱',
              'Your ' || replace(new.session_type::text,'_',' ') || ' session is scheduled. The meeting link is ready.',
              '/sessions/' || new.id);
    elsif new.status = 'suggested' then
      insert into notifications (user_id, kind, title, body, link)
      values (new.participant_id, 'session.suggested', 'New times suggested',
              'Your coach offered a few times that work for them. Pick what works for you.',
              '/sessions/' || new.id);
    elsif new.status = 'declined' then
      insert into notifications (user_id, kind, title, body, link)
      values (new.participant_id, 'session.rerouted', 'Finding you another match',
              'That coach wasn''t available — your request stays open for the next coach. No action needed.',
              '/sessions/' || new.id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_session
  after insert or update on session_requests
  for each row execute function notify_session_change();

-- Notify house manager + navigators when an application is submitted
create or replace function notify_housing_submission() returns trigger as $$
declare mgr uuid; nav record;
begin
  if new.status = 'submitted' and (old.status is distinct from 'submitted') then
    new.submitted_at := coalesce(new.submitted_at, now());
    select manager_id into mgr from housing_programs where id = new.program_id;
    if mgr is not null then
      insert into notifications (user_id, kind, title, body, link, channels)
      values (mgr, 'housing.submitted', 'New housing application',
              'A new application just arrived. Please review and schedule a virtual intake.',
              '/admin/housing/applications/' || new.id, '{in_app,email}');
    end if;
    for nav in select id from profiles where role in ('navigator','admin') loop
      insert into notifications (user_id, kind, title, body, link)
      values (nav.id, 'housing.submitted', 'New housing application',
              'A participant applied for recovery housing.', '/admin/housing/applications/' || new.id);
    end loop;
    -- confirm receipt to applicant, warmly
    insert into notifications (user_id, kind, title, body, link)
    values (new.applicant_id, 'housing.received', 'We received your application 💚',
            'Thank you for trusting us with your story. A Grace representative will reach out to schedule your virtual intake.',
            '/housing/applications/' || new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_housing
  before update on housing_applications
  for each row execute function notify_housing_submission();

-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY — consent-driven, role-based
-- ---------------------------------------------------------------------------
alter table profiles              enable row level security;
alter table session_requests      enable row level security;
alter table session_feedback      enable row level security;
alter table daily_checkins        enable row level security;
alter table resources             enable row level security;
alter table housing_programs      enable row level security;
alter table housing_beds          enable row level security;
alter table housing_applications  enable row level security;
alter table notifications         enable row level security;

create or replace function current_role_is(roles user_role[]) returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = any(roles));
$$ language sql security definer stable;

-- profiles: read own + coaches are publicly listable; staff read all
create policy profiles_self_read  on profiles for select using (
  id = auth.uid() or role = 'coach' or current_role_is('{navigator,admin}')
);
create policy profiles_self_write on profiles for update using (id = auth.uid());
create policy profiles_self_insert on profiles for insert with check (id = auth.uid());

-- session_requests: participant sees own; coaches see pool for their types + assigned; staff see all
create policy sr_participant on session_requests for select using (
  participant_id = auth.uid()
  or coach_id = auth.uid()
  or (status = 'pending' and exists (
        select 1 from profiles p where p.id = auth.uid()
          and p.role = 'coach' and session_type = any(p.coach_types)))
  or current_role_is('{navigator,admin}')
);
create policy sr_insert on session_requests for insert with check (participant_id = auth.uid());
create policy sr_update on session_requests for update using (
  participant_id = auth.uid() or coach_id = auth.uid()
  or current_role_is('{navigator,admin}')
  or (status = 'pending' and exists (
        select 1 from profiles p where p.id = auth.uid()
          and p.role = 'coach' and session_type = any(p.coach_types)))
);

-- feedback: authors + counterpart + staff
create policy sf_read on session_feedback for select using (
  author_id = auth.uid()
  or exists (select 1 from session_requests s where s.id = session_request_id
             and (s.participant_id = auth.uid() or s.coach_id = auth.uid()))
  or current_role_is('{navigator,admin}')
);
create policy sf_write on session_feedback for insert with check (author_id = auth.uid());

-- daily_checkins: PRIVATE BY DEFAULT. Coach sees only when coach_visible = true
-- and only for participants they have an accepted/completed session with.
create policy dc_own on daily_checkins for select using (
  user_id = auth.uid()
  or (coach_visible and exists (
        select 1 from session_requests s
        where s.coach_id = auth.uid() and s.participant_id = daily_checkins.user_id
          and s.status in ('accepted','completed')))
);
create policy dc_insert on daily_checkins for insert with check (user_id = auth.uid());
create policy dc_update on daily_checkins for update using (user_id = auth.uid());
create policy dc_delete on daily_checkins for delete using (user_id = auth.uid());

-- resources & programs: readable by everyone signed in; writable by staff
create policy res_read  on resources for select using (true);
create policy res_write on resources for all using (current_role_is('{navigator,admin}'));
create policy hp_read   on housing_programs for select using (true);
create policy hp_write  on housing_programs for all using (current_role_is('{navigator,admin}'));

-- beds: availability counts are public via view; row detail is staff + house manager
create policy hb_staff on housing_beds for all using (
  current_role_is('{navigator,admin}')
  or exists (select 1 from housing_programs p where p.id = program_id and p.manager_id = auth.uid())
);

-- applications: applicant + program manager + staff
create policy ha_read on housing_applications for select using (
  applicant_id = auth.uid()
  or current_role_is('{navigator,admin}')
  or exists (select 1 from housing_programs p where p.id = program_id and p.manager_id = auth.uid())
);
create policy ha_insert on housing_applications for insert with check (applicant_id = auth.uid());
create policy ha_update on housing_applications for update using (
  (applicant_id = auth.uid() and status in ('draft','submitted'))
  or current_role_is('{navigator,admin}')
  or exists (select 1 from housing_programs p where p.id = program_id and p.manager_id = auth.uid())
);

-- notifications: strictly own
create policy n_own on notifications for select using (user_id = auth.uid());
create policy n_mark on notifications for update using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. SEED — Grace House (Iowa) + starter resources
-- ---------------------------------------------------------------------------
insert into housing_programs (name, slug, city, county, description, rules, expectations, populations, telehealth_priority, contact_email, total_beds)
values (
  'Grace House', 'grace-house', 'Des Moines', 'Polk',
  'A grace-based recovery residence where every pathway is honored. No fees. No stigma. Just grace — and a community that grows together like mycelium under the forest floor.',
  '[
    {"title":"A substance-free home","body":"Grace House is a substance-free living environment. MAT prescriptions are fully welcomed and supported."},
    {"title":"Show up for community","body":"Attend the weekly house circle and one recovery activity of your choosing each week — any pathway counts."},
    {"title":"Honor quiet hours","body":"10pm–7am, so every resident can rest and rebuild."},
    {"title":"Care for shared spaces","body":"Rotating light chores keep our home a place of dignity for everyone."},
    {"title":"Communicate, don''t disappear","body":"If something is hard, tell a house manager or peer. Struggle is never punished here — silence is what we try to avoid."}
  ]'::jsonb,
  '[
    {"title":"You will be treated as a whole person","body":"Person-first, trauma-informed, always."},
    {"title":"Setbacks are met with grace","body":"A return to use opens a conversation and a plan — never shame."},
    {"title":"Your goals are yours","body":"We''ll support GROW/SMART goals you choose, at your pace."}
  ]'::jsonb,
  '{mat_friendly,justice_involved,all_pathways}', true,
  'gracehouse@gfa.org', 8
);

insert into housing_beds (program_id, label)
select id, 'Room ' || r || ' · Bed ' || b
from housing_programs, generate_series(1,4) r, unnest(array['A','B']) b
where slug = 'grace-house';

insert into resources (title, category, description, url, county, statewide, telehealth, tags) values
('Iowa Warm Line', 'peer_support', 'Free peer-run listening line, evenings & weekends.', 'https://www.iowawarmline.org', null, true, true, '{phone,free,peer}'),
('YourLifeIowa', 'crisis', '24/7 support for substance use & gambling — call, text, or chat.', 'https://yourlifeiowa.org', null, true, true, '{24_7,chat,text}'),
('Telehealth MAT Access (Rural)', 'mat', 'Statewide telehealth MAT prescribers prioritizing rural counties.', null, null, true, true, '{mat,rural,telehealth}'),
('Grace House', 'housing', 'Grace-based recovery residence in Des Moines. Beds shown in real time.', '/housing/grace-house', 'Polk', false, false, '{housing,grace}');
