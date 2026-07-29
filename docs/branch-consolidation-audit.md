# Branch & Production-Schema Consolidation Audit

**Date:** 2026-07-29
**Scope:** Reconcile the parallel branches on `origin` and the parallel writes they made to the
live Supabase project `ykykeioydvtxpyreshhs`.
**Method:** Read-only. Git diffs of each branch vs `main`; the live `supabase_migrations`
history; live `gfa_residence` table inventory + row counts. **No merges, drops, or writes
were performed.**

> Bottom line up front: there are **three-to-four parallel builds** that each applied
> migrations directly to the **same production database**, without knowledge of each other.
> The result is duplicated table families in `gfa_residence` (two policy engines, two
> document/signature stacks). The good news: **all the duplicated document/signature tables
> are empty**, so deduplication carries no signed-data loss. The blocker to finishing is that
> the *most complete and still-active* build — the `grace_house_gate*` / `oqjtik` line — has
> **never been pushed to git**, so its application code cannot be seen or preserved.

---

## 1. Branches on `origin` (git level)

| Branch | Base | Commits | What it adds | Schema? |
|---|---|---|---|---|
| `claude/live-app-source` | **orphan (no merge-base)** | 1 | Full standalone snapshot of the deployed "v3 Quantum Bridge" frontend (`src/` 313 files, `base44/`, its own `gracehouse/`, `supabase/`) | `0002_vrcc_quantum_extension.sql` |
| `claude/v2-build-verification-4skk46` | `3293e0a2` | 11 | A parallel `v2/` app (housing + sessions + offline sync + edge functions) and `.agents/` investigation docs | 3 migrations under `v2/supabase/migrations/` |
| `claude/gracehouse-buildout` (this session) | `3293e0a2` | 4 | `gracehouse/` React-19 app + policy engine / documents / roles | 3 migrations `gracehouse_*` |
| `claude/launch-schema-wiring-audit-fw5ajb` | `c21ed2df` | 6 | **Docs only** (audit + launch-readiness reports). The MVP code it documents lives on `vrcc-refine`→`main`. | none |
| `claude/grace-house-vrcc-buildout-oqjtik` | — | — | **NOT ON ORIGIN.** Its migrations are in prod (see §3); its source is not in git. | `grace_house_gate*`, `gracehouse_public_forms`, `gracehouse_intake_workflow` |

`live-app-source` having **no common ancestor** with `main` confirms it is a recovered snapshot,
not a normal feature branch — it cannot be fast-forward merged; it can only be cherry-picked or
adopted wholesale as a new root.

---

## 2. Root cause (already diagnosed on the v2 branch, now confirmed by the migration log)

Multiple parallel Claude Code sessions — started by one owner — each pointed at the **same
production Supabase project** and each applied migrations **directly to prod**, none aware of
the others. That is why there are two or three copies of the same concept. This is a process
problem, not a code problem, and it will keep recurring until the process changes (see §6).

---

## 3. What actually hit production (the migration log is the truth)

Reading `supabase_migrations.schema_migrations`, three distinct build lineages wrote to prod
**after** the shared MVP baseline:

**Lineage A — the `oqjtik` Grace House build (the leading one, still active):**
```
20260721093025  grace_house_gate1_policy_engine
20260721093239  grace_house_gate2_documents_signatures
20260721093518  grace_house_gate3_residence_ops
20260721094227  grace_house_gate3b_fn_hardening
20260728004300  grace_house_gate4b_house_board
20260728090254  gracehouse_public_forms
20260728091330  gracehouse_intake_workflow
20260729021729  expose_gfa_residence_to_postgrest      ← TODAY
20260729063611  allow_bed_removal                      ← TODAY
```

**Lineage B — this session's Grace House build (a smaller parallel duplicate, one day later):**
```
20260722174737  gracehouse_policy_engine
20260722174757  gracehouse_documents_signatures
20260722175138  gracehouse_residence_roles
```

**Lineage C — the v2 build and the Quantum-Bridge snapshot (also applied):**
```
20260722153953  vrcc_quantum_bridge_v3
20260722154113  vrcc_quantum_bridge_v3_1
20260722163355  v2_foundation
20260722163418  v2_go_live
20260722163546  v2_advisor_hardening
20260723052952  vrcc_grace_house_seed_and_ooma_fix
```
(No separate `v2`/`vrcc` schema exists — these wrote into the existing `public` / `gfa_*`
schemas.)

**Key fact:** Lineage A is still receiving migrations **today (07-29)**, long after this
session's last write (07-22). A parallel session is actively building on prod right now.

---

## 4. The concrete collision in `gfa_residence` (37 tables, bloated by duplication)

Both Grace House lineages built the *same two concepts* under *different names*, so instead of
colliding they created **two complete parallel copies**:

| Concept | Lineage A (`oqjtik`, leading) | Lineage B (this session) | Live rows |
|---|---|---|---|
| Policy engine | `policies`, `policy_versions`, `policy_acknowledgments` | `policy`, `policy_version` | A: **6** policies / 6 versions · B: **4** / 4 |
| Documents & e-signature | `gh_documents`, `gh_document_versions`, `gh_document_signatures` | `document_template`, `document_version`, `document_assignment`, `signature` | **both 0 rows** |

Lineage A additionally built the entire residence-operations suite that Lineage B never did:
`grievances`, `pass_requests`, `house_meetings`, `emergency_removals`,
`releases_of_information`, `providers`, `provider_members`, `public_profiles`,
`decision_register`, `residence_audit_log`, `checkin_followups`, `chore_assignments`,
`announcements`, plus public forms + an intake workflow.

**Data-safety conclusion:** the only populated Grace House data is policy config (re-seedable)
and 3 `residences` rows. **No resident has signed anything in either document stack.** So
retiring one duplicate stack loses no user data.

---

## 5. Recommendation

The evidence points one way:

1. **Designate Lineage A (`oqjtik` / `grace_house_gate*` + `gracehouse_public_forms`/`intake`)
   as the canonical Grace House build.** It is the most complete, it owns the full residence-ops
   suite, and it is the one still under active development in prod.

2. **This session's build (Lineage B) is the redundant duplicate.** Its tables are empty
   (documents) or superseded by A's richer seed (policy). It should be *retired*, not extended —
   but **not dropped yet** (see blocker below).

3. **`live-app-source`** is the recovered production frontend — keep as the source-of-record for
   what vrcc.app actually serves; adopt as a new root rather than merging.

4. **`v2-build-verification`** — its investigation docs are the valuable part and are already the
   basis of this diagnosis. Whether the `v2/` app itself survives is a separate product call; its
   migrations are already live and additive.

5. **`launch-schema-wiring-audit`** (this branch) — docs only, safe, no reconciliation needed.

### The blocker (unchanged, now proven critical)

**Lineage A's application source has never been pushed to git.** Its *schema* dominates prod,
but its *frontend/app code is invisible.* We must not drop Lineage B's tables — or wire any app
to Lineage A's — until A's branch (`claude/grace-house-vrcc-buildout-oqjtik`) is pushed and its
code is readable. If that session's container has been reclaimed and the code is gone, prod still
has the schema, but the app must be rebuilt against it.

**So the single most important next action is still: get `oqjtik` pushed to origin.** It is not a
side branch — it is the leading build, and it is the only one whose code cannot currently be seen.

---

## 6. Governance fix (stops the recurrence)

- **One active session against prod at a time.** Parallel sessions on one shared database is the
  root cause of every duplicate above.
- **Everything through git before it touches prod.** No migration is applied to
  `ykykeioydvtxpyreshhs` until its branch is pushed and the migration reviewed.
- **Migrations on a Supabase dev branch first**, then merge — never `apply_migration` straight to
  prod.
- **One canonical name per concept.** Adopt Lineage A's names; forbid re-creating the same concept
  under a synonym.

---

## 6a. UPDATE (07-29): the live deployment is now located — and its source is NOT in git

Owner supplied `https://gfa-vrcc.pages.dev/vrcc/app/`. Verified directly:

- **`vrcc.app` and `gfa-vrcc.pages.dev` serve the identical build** — byte-identical bundle
  hashes (`index-DMwbAUg-.js`, `vendor-three-BtjH7Fki.js`, `index-BbPQ0YU6.css`).
  → **vrcc.app is served by the Cloudflare _Pages_ project `gfa-vrcc`**, app mounted at
  `/vrcc/app/`. It is **not** the `virtualrecovery` Worker (that was a different, lesser deploy).
- It is one unified flagship app: the live JS bundle contains **ICARE, Grace Companion, and
  Grace House** together. PWA (manifest, standalone, theme `#1FB6B6`).
- Backend: same Supabase `ykykeioydvtxpyreshhs`, same publishable anon key
  (`sb_publishable_9NOk…` — public by design). CSP `connect-src` confirms live wiring to
  Supabase (REST + realtime), **Stripe.js (payments)**, an Iowa recovery map, weather, and
  ArcGIS/OSM tiles. Vendor chunks: `vendor-three` (WebGL), `vendor-charts`, `vendor-motion`,
  `vendor-ui`, `vendor-supabase`.

**Critical:** this deployed build is **not captured by any pushed branch.**
`claude/live-app-source` has a trivial `vite.config.js` (`plugins:[react()]`), no `three`,
no `recharts`, no Stripe, and no `/vrcc/app` base — it **cannot** produce the deployed bundles.
So `live-app-source` is an *earlier/simpler* recovered snapshot, **not** the code now serving
vrcc.app. The true production source is only in an **unpushed session** — most plausibly the
still-active `oqjtik` line, whose live schema (`policies`, `gh_documents`, the full residence-ops
suite, `gracehouse_public_forms`/`intake_workflow`) matches a Grace-House-inclusive app and is
the only lineage still shipping migrations this week.

**Consequence — production has no source-of-truth in git.** If that session's container is
reclaimed, the live app can only be recovered from **minified bundles on Cloudflare**, not from
source. Backing up the real source (pushing that session's branch) is now the single highest
priority, ahead of any deduplication.

## 6b. UPDATE (07-29): dedup migration written (Phase 1, reversible, not yet applied)

`supabase/migrations/20260729100000_gracehouse_dedup_quarantine_lineage_b.sql` implements the
§5 decision. Re-verified against prod before writing: Lineage B document/signature tables still
empty; no external FK into B; the only B dependents are B's own `gh_curfew_violations()` +
`gh_signature_immutable()` trigger fn; the `gh_signature_status` view reads Lineage A only.

Phase 1 = **quarantine, nothing dropped**: move the 6 Lineage-B tables + 2 functions into a new
unexposed `gfa_residence_deprecated` schema (RLS/indexes/trigger travel with them; the 4+4 policy
config rows are preserved). This removes the duplicate from the PostgREST API and is fully
reversible (rollback block included). Phase 2 (`drop schema … cascade`) is commented out and
requires an observation window + explicit sign-off. **Not applied to prod** — pending owner
decision to test on a dev branch or apply during a quiet window.

## 7. What was NOT done

No branch was merged. No table was dropped. No migration was applied. This document is the plan;
executing any deduplication requires (a) `oqjtik` pushed to git and (b) explicit owner approval of
the canonical direction in §5.
