-- Grace House — Residence-scoped staff roles (additive; APPLIED to prod).
-- Models the 8-role matrix WITHOUT touching shared role helpers (is_staff/get_my_role),
-- so it is purely additive and prod-safe. Residents are identified via participant
-- identity (gfa_ui.my_participant_id); this table is for the 7 staff roles.

create table if not exists gfa_residence.residence_staff (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references gfa_residence.residences(id),
  user_id uuid not null,
  role text not null check (role in ('peer_mentor','recovery_coach','house_manager','gfa_support','residence_admin','compliance_admin','executive_director')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (residence_id, user_id, role)
);
create index if not exists residence_staff_user on gfa_residence.residence_staff(user_id);

create or replace function gfa_residence.my_residence_roles(res uuid)
returns text[] language sql stable security definer set search_path to 'gfa_residence','public' as $$
  select coalesce(array_agg(role), array[]::text[])
  from gfa_residence.residence_staff where residence_id = res and user_id = auth.uid() and active;
$$;
create or replace function gfa_residence.has_residence_role(res uuid, roles text[])
returns boolean language sql stable security definer set search_path to 'gfa_residence','public' as $$
  select exists (
    select 1 from gfa_residence.residence_staff
    where residence_id = res and user_id = auth.uid() and active and role = any(roles)
  ) or public.is_admin();
$$;

alter table gfa_residence.residence_staff enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='residence_staff' and policyname='rs_self_read') then
    create policy rs_self_read on gfa_residence.residence_staff for select to authenticated
      using (user_id = auth.uid() or public.is_admin() or gfa_core.is_staff());
    create policy rs_admin_write on gfa_residence.residence_staff for all to authenticated
      using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Residence config: the existing 'Grace House' row (id …201) was updated with the locked
-- canonical facts (1311 9th Street; women-focused; narr_cert_status='pending' → app renders
-- "Preparing for NARR Level II certification"; fees 175/200; warmline; MAT/supervision on).
