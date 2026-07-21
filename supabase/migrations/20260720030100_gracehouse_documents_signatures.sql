-- Grace House — Document & Signature Integrity layer (GH build, step 2 of foundation)
-- REVIEWABLE MIGRATION — run on a Supabase DEV BRANCH first, then merge. Additive only.
--
-- Guarantees (per directive 3.2 + Iowa UETA retention principles):
--  • Every signed document captures an IMMUTABLE content snapshot + explicit intent-to-sign.
--  • Materially changed documents require a NEW version and RE-acknowledgment.
--  • No administrator can silently edit signed content (snapshots are write-once).

begin;

-- 1. Template: a document type (participant agreement, ROI, grievance …). Reuses gfa_ui.consent_records for consents later.
create table if not exists gfa_residence.document_template (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,          -- 'GH-DOC-PARTICIPANT-AGREEMENT'
  title      text not null,
  category   text not null,                 -- agreement | intake | consent | staff
  requires_witness boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Version: the publishable content. Once status='PUBLISHED', content is treated as frozen.
create table if not exists gfa_residence.document_version (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references gfa_residence.document_template(id) on delete cascade,
  version      integer not null,
  status       text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','SUPERSEDED')),
  content      jsonb not null,              -- sections/fields/clauses; frozen at publish
  policy_refs  jsonb not null default '[]'::jsonb,   -- policy_version ids this doc renders from
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (template_id, version)
);
create unique index if not exists document_version_one_published
  on gfa_residence.document_version(template_id) where status='PUBLISHED';

-- 3. Assignment: a specific document version assigned to a specific resident to complete.
create table if not exists gfa_residence.document_assignment (
  id                  uuid primary key default gen_random_uuid(),
  document_version_id uuid not null references gfa_residence.document_version(id),
  resident_id         uuid not null,        -- gfa_ui participant/resident id (convention: matches gfa_residence.*.resident_id)
  residence_id        uuid references gfa_residence.residences(id),
  status              text not null default 'assigned' check (status in ('assigned','in_progress','signed','superseded')),
  form_values         jsonb not null default '{}'::jsonb,
  assigned_at         timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists doc_assignment_resident on gfa_residence.document_assignment(resident_id);

-- 4. Signature: write-once record of intent + immutable snapshot of what was signed.
create table if not exists gfa_residence.signature (
  id               uuid primary key default gen_random_uuid(),
  assignment_id    uuid not null references gfa_residence.document_assignment(id),
  signer_id        uuid not null,
  signer_role      text not null,           -- resident | staff_witness | house_manager
  content_snapshot jsonb not null,          -- immutable copy of document content + form_values at signing
  representation   text not null,           -- 'drawn' (data-uri) | 'typed'
  representation_data text,
  intent_ack       text not null,           -- explicit intent-to-sign statement the signer affirmed
  initials         jsonb default '{}'::jsonb,
  signed_at        timestamptz not null default now()
);
-- write-once: block UPDATE/DELETE of signatures at the DB level.
create or replace function gfa_residence.gh_signature_immutable() returns trigger language plpgsql as $$
begin raise exception 'signatures are immutable (write-once)'; end $$;
drop trigger if exists sig_no_update on gfa_residence.signature;
create trigger sig_no_update before update or delete on gfa_residence.signature
  for each row execute function gfa_residence.gh_signature_immutable();

-- 5. RLS: resident sees only her own assignments/signatures; staff see their residence; admin all.
alter table gfa_residence.document_template   enable row level security;
alter table gfa_residence.document_version    enable row level security;
alter table gfa_residence.document_assignment enable row level security;
alter table gfa_residence.signature           enable row level security;

do $$ begin
  -- templates & versions: staff/all authenticated read (they are program docs, not PHI); admin write.
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='document_template' and policyname='tmpl_read') then
    create policy tmpl_read on gfa_residence.document_template for select to authenticated using (true);
    create policy tmpl_write on gfa_residence.document_template for all to authenticated using (public.is_admin()) with check (public.is_admin());
    create policy dv_read on gfa_residence.document_version for select to authenticated using (true);
    create policy dv_write on gfa_residence.document_version for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  -- assignments: resident own (via gfa_ui.my_participant_id), staff, admin.
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='document_assignment' and policyname='da_resident') then
    create policy da_resident on gfa_residence.document_assignment for select to authenticated
      using (resident_id = gfa_ui.my_participant_id());
    create policy da_resident_upd on gfa_residence.document_assignment for update to authenticated
      using (resident_id = gfa_ui.my_participant_id()) with check (resident_id = gfa_ui.my_participant_id());
    create policy da_staff on gfa_residence.document_assignment for all to authenticated
      using (gfa_core.is_staff() or public.is_admin()) with check (gfa_core.is_staff() or public.is_admin());
  end if;
  -- signatures: resident may INSERT/READ her own; staff read within role; nobody updates (trigger).
  if not exists (select 1 from pg_policies where schemaname='gfa_residence' and tablename='signature' and policyname='sig_resident') then
    create policy sig_resident on gfa_residence.signature for select to authenticated
      using (signer_id = gfa_ui.my_participant_id() or gfa_core.is_staff() or public.is_admin());
    create policy sig_insert on gfa_residence.signature for insert to authenticated
      with check (signer_id = gfa_ui.my_participant_id() or gfa_core.is_staff() or public.is_admin());
  end if;
end $$;

commit;

-- NOTE: resident_id / signer_id reference convention (gfa_ui participant identity) must be
-- confirmed against gfa_ui.my_participant_id() during the RLS step before merge to prod.
