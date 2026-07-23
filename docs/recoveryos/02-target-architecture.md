# RecoveryOS Target Architecture — Deliverable 8 (Recommendation + Tradeoffs)

**Date:** 2026-07-23 · **Status:** RECOMMENDATION — requires owner decisions D-1/D-4 below
**Prerequisite reading:** `01-ecosystem-audit.md`

---

## 0. Correction to the audit — what production actually is (verified today)

The deployed bundle at **vrcc.app** (fetched 2026-07-23, worker `virtualrecovery`
modified 06:10 today) is **not built from this repository**. It queries the
`gfa_ui`-generation tables (`participant_profiles`, `access_requests`, `sessions`,
`assessments_barc10`, `journey_events`, `icare_plans`, `daily_cultivations`,
`slogans`, `check_in_records`, `housing_entries`, `residences`, `consent_tokens`,
`privacy_preferences`) and RPCs (`materialize_booking_request`,
`provision_coach_from_access_request`, `my_core_participant_id`). No `mvp_*`
references exist in the bundle.

**INFERENCE (strong):** production is the `GFAVRCC/grace-harbor-16` app — the
June-era generation whose migrations (`expose_gfa_schemas_to_postgrest`,
`session_engine_phase2b`, `coach_identity_provisioning`) match its query surface,
and the likely home of ICARE, the slogan engine UI, and possibly Brain Atlas /
Recovering the Mind / The Tapes We Carry. It cannot be read from this session
(different GitHub org).

**Consequence:** the ecosystem has **four** sessions implementations (session-engine
booking_requests = live, mvp_*, mvp_*+quantum-bridge, v2_*) and the "live app" seat
this audit assumed belonged to the MVP was taken over — today — by a different
codebase. This is the strongest possible evidence for the governance findings below.

---

## 1. Recommended target architecture: **Option C — one RecoveryOS foundation, separate experience shells**

```text
RecoveryOS Foundation (ONE Supabase project — already true)
├── Identity layer      person ← auth.users; program enrollments; crosswalk (EXISTS, finish it)
├── Service engine      sessions/booking, check-ins, recovery capital, slogans,
│                       resources, notifications, Grace AI (ONE canonical each)
├── Residence ops       gfa_residence.* + policy/documents/signatures engine
└── Analytics           canonical metrics views; no double counting

Experience shells (separate deploys, shared auth + design system)
├── vrcc.app            VRCC participant experience
├── residence.vrcc.app  Resident experience + staff workspace  (RecoveryResidenceOS name available)
├── Coach/Navigator workspace (grow from the strongest existing coach UI)
└── Executive/admin     later; reporting views first, UI second
```

**Why C over A (one integrated app):** the participant/resident distinction is a
compliance and analytics boundary, not just navigation; the residence workspace has
different roles, retention rules, and legal artifacts (signatures, NARR evidence).
One app means one bundle where permission complexity compounds — the legacy app's
"27 destinations, all unlocked" is what A degenerates into here.

**Why C over B (fully separate products):** the same person is often both
participant and resident; separate stacks fork identity and double-count outcomes —
the exact failure the crosswalk work was built to prevent. Shared foundation, split
shells keeps one person, one record, many relationships.

**Why not a total rebuild:** the foundation already exists — identity crosswalk,
enrollment gates, residence schema, recovery-capital + slogan engines, Grace AI
functions. The debt is *duplication*, not absence. Rebuilding creates a sixth
generation; consolidation retires four.

---

## 2. D-1 recommendation: canonical implementation per capability

Do **not** pick one winner for everything. Pick per capability, using two tests:
*(a) what does production depend on today; (b) which model survives the identity
seam.* Where they conflict, production wins short-term and the seam wins long-term.

| Capability | Canonical (recommend) | Retire / harvest | Tradeoff accepted |
|---|---|---|---|
| **Identity** | `gfa_identity` crosswalk → finish as `person` + `program_enrollment` (the Layer-1/2 model) | email-keyed RLS (mvp/quantum), `v2_profiles` role model, duplicate participant tables ×3 | Migration touch on every policy — but data is ~7 people; cheapest it will ever be |
| **Sessions / booking** | **Live session engine** (`booking_requests` + `materialize_booking_request`) — it is what production users touch | `mvp_session_requests` (+ quantum-bridge columns), `v2_session_requests`; **harvest from v2/quantum:** client-ref idempotency, meeting-provider field, notification triggers | Canonizing a system whose frontend source is unaudited (grace-harbor-16) — MUST audit it first (D-4) |
| **Daily practice / check-ins** | ONE table. Recommend `v2_daily_checkins` *model* (one row/day, per-day consent, client_ref) applied wherever canon lands; quantum-bridge's `daily_pulse`+`daily_cultivations` split is second choice if production already writes them | the other 5–6 check-in tables (all empty) | Two live-ish variants (v2 demo data vs `check_in_records`/`daily_cultivations` in prod app) — needs D-4 to see which UX survives |
| **Recovery capital** | `public.barc10_assessments` (has real data) + v6 domain model | `gfa_ui.barc10_assessments` / `assessments_barc10` duplicate | Rename/mapping shim while the live app still reads its own alias |
| **Residence / beds / housing ops** | **`gfa_residence.*`** + gracehouse policy/documents/signatures engine — richest, compliance-aware, matches truth register | `public.residence_beds` (quantum), `v2_housing_beds`/`v2_housing_programs`/`v2_housing_applications`, `public.housing_applications` (quantum), `gfa_ui.housing_entries`; **harvest from v2:** rules-before-apply constraint + wizard UX; **from quantum:** directory-entry linkage | Three bed systems die; the resident-facing UI must be rebuilt on gfa_residence (planned anyway per GH-D100) |
| **Slogans / ICARE / content** | v6+gfa_ui engines already live in production app | `icare_plans` duplicate (keep one), nothing else | None material |
| **Grace AI** | ONE function: keep newest (`Grace`), fold `grace-companion`/`-v6` prompts in; ONE gateway | 2 legacy functions + 1 gateway | Regression risk if live app pins an old slug — verify before delete |
| **Crisis** | MVP `SupportNow` pattern (always-on overlay) as a shared component in every shell | page-only crisis UIs | None — additive |
| **Legacy Base44 app** | — | ARCHIVE the whole surface (60 pages, 38 functions, both SDK deps out of package.json) as a feature-idea catalog | Loses nothing: it is already unmounted |
| **v2 app (mine)** | Design donor + candidate shell chassis (PWA/offline/a11y patterns) | Its schema (after harvest); its **Virginia seed content is factually wrong** (canon: Des Moines, Iowa) and must not survive | Sunk cost — accepted; it was verification work, and its patterns carry forward |

**Net effect:** 4 sessions systems → 1 · 7 check-in tables → 1 · 4 housing systems → 1 ·
4 identity tables → 1 person model · 3 Grace AI functions → 1.

---

## 3. Paths scored (Section 15 mandate)

| Path | Effort | Regression risk | Preserves | Long-term | Verdict |
|---|---|---|---|---|---|
| 1 Incremental cleanup only | Low | Low | All | Weak — 5 generations remain | Insufficient alone |
| 2 IA/nav redesign over existing | Med | Med | Most | Weak — paints over split brain | Component of 3, not a path |
| **3 New shells reusing foundation + best components** | **Med** | **Med-low (data tiny)** | **All the strongest work** | **Strong** | **RECOMMENDED** |
| 4 Full frontend rebuild, keep backend | High | Med | Backend only | Strong but wasteful — live app UIs would be discarded sight-unseen | No (at least until D-4) |
| 5 Full platform rearchitecture | Very high | High | Little | Unproven need | No — foundation already exists |

---

## 4. Deployment topology (recommended)

- **One Cloudflare account, one worker per shell**: `vrcc.app` (participant),
  `residence.vrcc.app` (resident + staff; the empty `RecoveryResidenceOS` repo is the
  natural home), coach workspace either at `coach.vrcc.app` or role-gated inside
  vrcc.app initially. Same Supabase auth domain ⇒ shared sign-in across shells.
- **One Supabase project** (status quo) with **dev-branch discipline for every schema
  change** (adopt GH-D101 org-wide) and PostgREST-exposed schemas reduced to the
  canonical set.
- **Shared packages** (design system + supabase client + SupportNow + consent
  components) in one monorepo — this repo can become it.

---

## 5. Governance findings this morning's events make unavoidable

1. **Deployment freeze / single release owner:** production was *replaced* at 06:10
   today with no corresponding commit in this repository. Whoever holds the wrangler
   token is a de-facto release channel. All deploys should go through one Git-connected
   pipeline per shell.
2. **Schema freeze except through the consolidation plan** (Phase 0): three streams
   wrote to prod inside 48h — quantum bridge, v2, gracehouse. All feature work pauses
   until D-1 is ratified.
3. **Migration provenance:** repo-committed migrations for every applied change
   (quantum bridge exists only in the DB today).

---

## 6. Decisions required (blocking)

| ID | Decision | Recommendation |
|---|---|---|
| D-1 | Ratify per-capability canon (§2) | As tabled above |
| D-2 | GH-D100 (residence frontend stack) / GH-D101 (dev-branch discipline) | Adopt gracehouse plan; extend D101 to all streams |
| **D-4 (new)** | **Audit `grace-harbor-16` before touching sessions/check-ins canon** — it is production and unreadable from here | Start a GFAVRCC-scoped session; run the same audit prompt; reconcile with this doc |
| D-5 (new) | Who deployed at 06:10 today, and via what pipeline? | Identify the stream owner; route future deploys through Git |

**Sequence from here:** D-4 audit → ratify D-1 → Deliverables 3/4 finalized → seven-area
navigation + journeys (D-6/7) → migration plan (D-9) → build.
