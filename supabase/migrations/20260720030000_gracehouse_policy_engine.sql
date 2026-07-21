-- Grace House — Canonical Policy Engine (GH build, step 1 of foundation)
-- REVIEWABLE MIGRATION — intended to run on a Supabase DEV BRANCH first, then merge.
-- Additive only. Lives in the existing gfa_residence subsystem (no parallel schema).
--
-- Documents, UI copy, notifications, and workflow logic must reference policy_version
-- rows — never hardcoded values. The consistency validator enforces the curfew ceiling.

begin;

-- 1. policy: a named, versioned governance object (curfew, fees, contact, language …).
create table if not exists gfa_residence.policy (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,                 -- e.g. 'GH-CURFEW-001'
  residence_id uuid references gfa_residence.residences(id),  -- null = organization-wide
  title        text not null,
  category     text not null,                         -- curfew | fees | contact | language | visitor | screening | discharge
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. policy_version: immutable structured values + prose, moving through a review lifecycle.
create table if not exists gfa_residence.policy_version (
  id             uuid primary key default gen_random_uuid(),
  policy_id      uuid not null references gfa_residence.policy(id) on delete cascade,
  version        integer not null,
  status         text not null default 'DRAFT'
                   check (status in ('DRAFT','LEADERSHIP REVIEW','LEGAL REVIEW REQUIRED',
                                     'CERTIFICATION REVIEW','APPROVED','ACTIVE','SUPERSEDED')),
  effective_date date,
  values         jsonb not null default '{}'::jsonb,  -- structured, machine-readable
  prose          text,                                 -- human rendering
  created_by     uuid,
  created_at     timestamptz not null default now(),
  unique (policy_id, version)
);
-- at most one ACTIVE version per policy
create unique index if not exists policy_version_one_active
  on gfa_residence.policy_version(policy_id) where status = 'ACTIVE';

-- 3. Consistency validator: the curfew hard ceiling (never past midnight), per GH-CURFEW-001.
--    Returns violating rows; a release check fails if this returns anything.
create or replace function gfa_residence.gh_curfew_violations()
returns table(policy_code text, version int, phase text, day text, value text) language sql stable as $$
  with active as (
    select p.code, v.version, v.values
    from gfa_residence.policy p
    join gfa_residence.policy_version v on v.policy_id = p.id and v.status = 'ACTIVE'
    where p.category = 'curfew'
  ), unrolled as (
    select code, version, ph.key as phase, d.key as day, d.value #>> '{}' as value
    from active,
         jsonb_each(values->'phases') ph,
         jsonb_each(ph.value) d
  )
  select code, version, phase, day, value
  from unrolled
  -- any value strictly greater than 00:00 but interpreted as evening (>= 12:30) OR literally past midnight.
  -- Canonical values are 21:00..24:00; midnight is stored as '24:00'. Anything > '24:00' or '00:01'..'11:59' (a.m.) is invalid.
  where (value > '24:00') or (value ~ '^(0[0-9]|1[01]):' );
$$;

-- 4. RLS: staff may read; admins/compliance may write. (Refine role checks in the RLS step.)
alter table gfa_residence.policy         enable row level security;
alter table gfa_residence.policy_version enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='policy' and policyname='policy_staff_read') then
    create policy policy_staff_read on gfa_residence.policy for select to authenticated using (gfa_core.is_staff() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='policy' and policyname='policy_admin_write') then
    create policy policy_admin_write on gfa_residence.policy for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='policy_version' and policyname='pv_staff_read') then
    create policy pv_staff_read on gfa_residence.policy_version for select to authenticated using (gfa_core.is_staff() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='policy_version' and policyname='pv_admin_write') then
    create policy pv_admin_write on gfa_residence.policy_version for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- 5. Seed canonical policies (ACTIVE). Values are the single source of truth for the app.
insert into gfa_residence.policy (code,title,category) values
  ('GH-CURFEW-001','Phase-based curfew & quiet hours','curfew'),
  ('GH-FEES-001','Program fees','fees'),
  ('GH-CONTACT-001','Canonical contact information','contact'),
  ('GH-LANG-001','Person-first, trauma-informed language standard','language')
on conflict (code) do nothing;

-- GH-CURFEW-001 v2.0 — hard ceiling midnight; quiet hours start at curfew, end 07:00.
insert into gfa_residence.policy_version (policy_id,version,status,effective_date,values,prose)
select id, 2, 'ACTIVE', current_date,
 jsonb_build_object(
   'ceiling','24:00','quiet_start','curfew','quiet_end','07:00',
   'phases', jsonb_build_object(
     '1', jsonb_build_object('sun_thu','21:00','fri_sat','22:00'),
     '2', jsonb_build_object('sun_thu','22:00','fri_sat','23:00'),
     '3', jsonb_build_object('sun_thu','23:00','fri_sat','24:00')),
   'overnight_pass_eligible_days',60,'extension_notice_hours',24,'overnight_notice_hours',48),
 'Phase 1: 9:00 PM Sun–Thu / 10:00 PM Fri–Sat. Phase 2: 10:00 PM / 11:00 PM. Phase 3: 11:00 PM / 12:00 AM. Curfew never progresses past midnight. Quiet hours run from curfew to 7:00 AM.'
from gfa_residence.policy where code='GH-CURFEW-001'
on conflict (policy_id,version) do nothing;

-- GH-FEES-001 v1.0 — monthly prepay applies only to full advance payment.
insert into gfa_residence.policy_version (policy_id,version,status,effective_date,values,prose)
select id, 1, 'ACTIVE', current_date,
 jsonb_build_object(
   'double', jsonb_build_object('weekly',175,'monthly_prepaid',650),
   'single', jsonb_build_object('weekly',200,'monthly_prepaid',700),
   'monthly_requires_full_advance', true,
   'deposit', null, 'refund', null),  -- GH-D004: leadership decision pending
 'Double (shared) room: $175/week, or $650/month when paid in advance in full. Single (private) room: $200/week, or $700/month when paid in advance in full. Monthly rates apply only to full advance payment. Deposit & refund terms pending leadership decision (GH-D004).'
from gfa_residence.policy where code='GH-FEES-001'
on conflict (policy_id,version) do nothing;

-- GH-CONTACT-001 v1.0
insert into gfa_residence.policy_version (policy_id,version,status,effective_date,values,prose)
select id, 1, 'ACTIVE', current_date,
 jsonb_build_object('office_phone','515-220-8771','email','gracehouse@graceforaddictions.org','warmline','515-310-DIAL (3425)'),
 'GFA Office: 515-220-8771 · gracehouse@graceforaddictions.org · Residents Warmline: 515-310-DIAL (3425)'
from gfa_residence.policy where code='GH-CONTACT-001'
on conflict (policy_id,version) do nothing;

-- GH-LANG-001 v1.0 — prohibited terms enforced by the language audit gate.
insert into gfa_residence.policy_version (policy_id,version,status,effective_date,values,prose)
select id, 1, 'ACTIVE', current_date,
 jsonb_build_object('prohibited', jsonb_build_array('addict','clean','dirty','offender','relapse'),
                    'note','Person-first, trauma-informed, stigma-free. "offender" only when quoting an official legal title.'),
 'All output is person-first and trauma-informed. Prohibited: addict, clean, dirty, offender (except a quoted legal title), relapse.'
from gfa_residence.policy where code='GH-LANG-001'
on conflict (policy_id,version) do nothing;

commit;

-- POST-APPLY CHECK (run on the dev branch; must return zero rows):
--   select * from gfa_residence.gh_curfew_violations();
