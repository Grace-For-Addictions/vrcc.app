-- Grace House schema de-duplication — Phase 1: quarantine the redundant lineage.
-- REVIEW-ONLY MIGRATION. Do NOT auto-apply to prod. Run on a Supabase dev branch
-- first, or apply during a quiet window with owner sign-off. NOTHING IS DROPPED here.
--
-- CONTEXT (see docs/branch-consolidation-audit.md + recovered-live-app/analysis/data-model.md)
-- Two parallel sessions each built a Grace House policy + document/signature stack in
-- gfa_residence under different names:
--   Lineage A (canonical — still active, richer):  policies · policy_versions ·
--       policy_acknowledgments · gh_documents · gh_document_versions ·
--       gh_document_signatures · view gh_signature_status
--   Lineage B (redundant duplicate — THIS is what we retire):  policy · policy_version ·
--       document_template · document_version · document_assignment · signature
--       + functions gh_curfew_violations() and gh_signature_immutable()
--
-- WHY THIS IS SAFE (verified 2026-07-29 against prod ykykeioydvtxpyreshhs):
--   • The live app (vrcc.app) calls NEITHER stack — its gfa_residence use is limited to
--     residences/beds/waitlist. Recovered from the deployed bundle. So retiring B cannot
--     break production.
--   • Every Lineage-B document/signature table is EMPTY (0 rows). No resident signed
--     anything. The only B data is 4 policy + 4 policy_version config rows, superseded by
--     Lineage A's 6 + 6 — and even those are PRESERVED (moved, not deleted).
--   • No table outside B has a foreign key into B (checked pg_constraint).
--   • The only code that reads B is B's own function gh_curfew_violations() and the
--     write-once trigger gh_signature_immutable(); both move with the lineage.
--   • gh_signature_status (a view) reads Lineage A only — untouched.
--
-- EFFECT: moving B into schema gfa_residence_deprecated makes it invisible to PostgREST
-- (only gfa_residence is exposed), stops all writes, and is fully reversible, while keeping
-- the data on disk for an observation window before any DROP (Phase 2, below).

begin;

-- 0. Preconditions — abort loudly if reality has drifted since the audit.
do $$
declare n_doc bigint; n_sig bigint;
begin
  -- Lineage A canonical tables must exist (we are keeping them).
  if to_regclass('gfa_residence.policies') is null
     or to_regclass('gfa_residence.gh_documents') is null then
    raise exception 'Lineage A (canonical) tables missing — stop; the audit assumption is invalid.';
  end if;
  -- Lineage B document/signature tables must still be empty (no signed data to lose).
  select coalesce(sum(c),0) into n_doc from (
    select count(*) c from gfa_residence.document_template
    union all select count(*) from gfa_residence.document_version
    union all select count(*) from gfa_residence.document_assignment) q;
  select count(*) into n_sig from gfa_residence.signature;
  if n_doc <> 0 or n_sig <> 0 then
    raise exception 'Lineage B document/signature tables are no longer empty (docs=%, sigs=%). Someone started using them — reassess before quarantining.', n_doc, n_sig;
  end if;
end $$;

-- 1. Quarantine schema (not exposed to PostgREST).
create schema if not exists gfa_residence_deprecated;
comment on schema gfa_residence_deprecated is
  'Retired Grace House Lineage B (duplicate of policies/gh_documents). Quarantined 2026-07-29 pending Phase-2 drop. See docs/branch-consolidation-audit.md.';

-- 2. Move Lineage-B tables out of the live schema. RLS policies, indexes, internal FKs
--    and the sig_no_update trigger all travel with their tables. Child-before-parent
--    order is not required for SET SCHEMA, but we move leaves first for readability.
alter table gfa_residence.signature            set schema gfa_residence_deprecated;
alter table gfa_residence.document_assignment  set schema gfa_residence_deprecated;
alter table gfa_residence.document_version     set schema gfa_residence_deprecated;
alter table gfa_residence.document_template    set schema gfa_residence_deprecated;
alter table gfa_residence.policy_version       set schema gfa_residence_deprecated;
alter table gfa_residence.policy               set schema gfa_residence_deprecated;

-- 3. Move Lineage-B-only functions. The sig_no_update trigger stays bound to
--    gh_signature_immutable by OID regardless of schema, so write-once protection on the
--    quarantined signature table remains intact. gh_curfew_violations is inert once its
--    tables are quarantined (nothing calls it; the live app uses no curfew RPC).
alter function gfa_residence.gh_signature_immutable()  set schema gfa_residence_deprecated;
alter function gfa_residence.gh_curfew_violations()    set schema gfa_residence_deprecated;

commit;

-- Tell PostgREST to refresh so the API no longer advertises the moved tables.
notify pgrst, 'reload schema';

-- ============================================================================
-- POST-APPLY VERIFICATION (run manually; all should hold)
-- ============================================================================
--   -- Lineage B no longer in the live schema (expect 0 rows):
--   select table_name from information_schema.tables
--   where table_schema='gfa_residence'
--     and table_name in ('policy','policy_version','document_template',
--                        'document_version','document_assignment','signature');
--
--   -- B data preserved in quarantine (expect policy=4, policy_version=4, rest=0):
--   select count(*) from gfa_residence_deprecated.policy;          -- 4
--   select count(*) from gfa_residence_deprecated.policy_version;  -- 4
--   select count(*) from gfa_residence_deprecated.signature;       -- 0
--
--   -- Lineage A intact (expect policies=6, and the view still valid):
--   select count(*) from gfa_residence.policies;
--   select count(*) from gfa_residence.gh_signature_status;   -- view still resolves

-- ============================================================================
-- ROLLBACK (reverses Phase 1 exactly — move everything back)
-- ============================================================================
--   begin;
--   alter table gfa_residence_deprecated.policy              set schema gfa_residence;
--   alter table gfa_residence_deprecated.policy_version      set schema gfa_residence;
--   alter table gfa_residence_deprecated.document_template   set schema gfa_residence;
--   alter table gfa_residence_deprecated.document_version    set schema gfa_residence;
--   alter table gfa_residence_deprecated.document_assignment set schema gfa_residence;
--   alter table gfa_residence_deprecated.signature           set schema gfa_residence;
--   alter function gfa_residence_deprecated.gh_signature_immutable() set schema gfa_residence;
--   alter function gfa_residence_deprecated.gh_curfew_violations()   set schema gfa_residence;
--   commit; notify pgrst, 'reload schema';

-- ============================================================================
-- PHASE 2 — PERMANENT DROP.  DO NOT RUN until: (a) an observation window has passed
-- with the quarantine in place and no breakage, and (b) explicit owner sign-off.
-- This is irreversible and destroys the 4 preserved B policy rows.
-- ============================================================================
--   begin;
--   drop schema gfa_residence_deprecated cascade;   -- drops all 6 tables + 2 functions
--   commit; notify pgrst, 'reload schema';
