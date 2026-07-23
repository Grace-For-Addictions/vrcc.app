# RecoveryOS Ecosystem Audit — Application Map (Deliverable 1 & 2, first pass)

**Date:** 2026-07-23 · **Auditor:** Claude (consolidation mandate)
**Method:** direct inspection of the vrcc.app repo (all branches), the live Supabase
project `ykykeioydvtxpyreshhs` (tables, migrations, edge functions), the Cloudflare
account (workers), and the GitHub repo list for the connected orgs.
**Rule:** anything not directly inspected is marked **UNVERIFIED**. No code changes
were made as part of this audit.

---

## 1. Canonical application table

| # | Product | User | Purpose | Repository / Path | Deployment | URL | Supabase surface | Status | Recommendation (preliminary) |
|---|---------|------|---------|-------------------|-----------|-----|------------------|--------|------------------------------|
| 1 | **VRCC MVP** | participant, coach | Signup → intake → BARC-10 → coach match → messaging/sessions; SupportNow crisis | `vrcc.app` `main` → `src/mvp/` (11 files) | Cloudflare Worker `virtualrecovery` (modified 2026-07-23 06:10) | vrcc.app | `public.participants`, `mvp_*`, `barc10_assessments`, `app_users` | **LIVE PRODUCTION** (7 participants, 6 users) | KEEP — strongest shell candidate for the participant experience |
| 2 | **Legacy Base44 app** | all roles | 60-page "everything" app: Grace AI chat, community ×3, gamification, VR, admin ×2, navigator ×2, provider portal, grants, IBHRS, Narcan, housing mgmt | `vrcc.app` `main` → `src/pages/` (60), `src/components/` (192), `base44/functions/` (38) | **Not mounted** — `src/main.jsx` renders MVP only; unreachable in shipped build | — | Base44 platform (external), not Supabase | DORMANT | ARCHIVE code; treat as feature-idea catalog; harvest, don't revive |
| 3 | **v2 "Quantum" app** | participant, coach, housing staff | Sessions, daily practice (morning/evening + mycelium map), housing hub + bed board; offline-first PWA | `vrcc.app` branch `claude/v2-build-verification-4skk46` → `v2/` | Not deployed (verified working via headless browser) | — | `public.v2_*` (applied to prod 2026-07-22) | BUILT, VERIFIED, UNDEPLOYED | CONSOLIDATE with #4/#5 — one canonical sessions + housing implementation must be chosen |
| 4 | **Quantum Bridge v3** | (backend only) | Extends **MVP** tables with session types, meeting providers (zoom/ooma/uma), `coach_meeting_rooms`, housing applications, bed tracking | migrations `vrcc_quantum_bridge_v3`, `vrcc_grace_house_seed_and_ooma_fix` (applied 2026-07-22/23, latest **this morning**) | n/a | — | `public.mvp_*` extensions | ACTIVE PARALLEL WORKSTREAM | CONSOLIDATE with #3 — this is a second implementation of the same v2 feature set |
| 5 | **Grace House app** | resident, residence staff | Resident onboarding, house info; staff portal placeholder; backed by policy engine + documents/signatures | `vrcc.app` branch `claude/gracehouse-buildout` → `gracehouse/` (TS, 4 routes, mostly scaffold) | Not deployed | — | `gfa_residence.*` (residences, beds(17), fees, drug_tests, incidents, discharges, phases, NARR compliance) + `gracehouse_*` policy/document migrations (applied 2026-07-22) | IN PROGRESS (branch updated 2026-07-22) | KEEP direction — this is the residence shell; decisions GH-D100/GH-D101 pending |
| 6 | **RecoveryResidenceOS** | residence ops? | **VERIFIED 2026-07-23: empty placeholder** — repo contains only a 2-line README ("VRCC Recovery Residence Operating system"); zero code | `Grace-For-Addictions/RecoveryResidenceOS` (pushed 2026-07-21) | none | none | none | NAME-ONLY PLACEHOLDER | Either retire it, or designate it the future home of the residence shell (#5) — a naming/ownership decision, not a code decision |
| 7 | **grace-harbor-16** | ? | UNVERIFIED — naming suggests a generated (Lovable-style) build; candidate home of Brain Atlas / Recovering the Mind / Tapes We Carry, which are absent from this repo | `GFAVRCC/grace-harbor-16` (private, pushed 2026-07-19) | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | Audit next — may hold signature IP |
| 8 | **GFA-ECO** | executive? | UNVERIFIED — "ECO" suggests Executive Command / org operations | `rcoiowa/GFA-ECO` (private, pushed 2026-07-19) | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | Audit next |
| 9 | **contact-connect-dashboard** | staff | Contact/CRM dashboard | `Grace-For-Addictions/contact-connect-dashboard` (pushed 2026-07-18) | UNVERIFIED | UNVERIFIED | Supabase project `vlsxjkqyaexcxwkbovlq` (**INACTIVE/paused**); `gfa_core.contact_connect` table also exists in main project | INACTIVE | Likely ARCHIVE or fold into staff workspace |
| 10 | **Late-Night-Recovery- / icrco / ICRCO-** | Iowa coalition | UNVERIFIED | `rcoiowa/…`, `GFAVRCC/…` (last pushed Jun/Mar 2026) | UNVERIFIED | UNVERIFIED | UNVERIFIED | Probably dormant; confirm then ARCHIVE |
| 11 | **External integrations** | — | Wix site (lead capture), FrameVR (circles), BeePurple/5CRM, IBHRS reporting | verified via DB tables (`wix_contact_submissions`, `frame_*`) + legacy functions | external SaaS | — | integration tables in main project | PARTIALLY ACTIVE | Inventory contracts in phase 2 |

**Supabase projects:** `ykykeioydvtxpyreshhs` "Grace For Addictions" (**ACTIVE — everything lives here**); `giloyvmjpyqrnbqbkxim` "GFAVRCC's Project" (INACTIVE); `vlsxjkqyaexcxwkbovlq` "contact-connect-dashboard" (INACTIVE).

**Cloudflare:** exactly **one** worker in the connected account: `virtualrecovery` (created 2026-07-20, modified 2026-07-23 06:10). Where repos #6–9 deploy, if anywhere, is UNVERIFIED from this account.

---

## 2. The database is the real map of the fragmentation

One live project carries **~150 tables across at least five schema generations**, almost all empty. Verified row counts: 7 participants, 6 app_users, 2 intakes, 2 BARC-10, 47 session_events; nearly everything else is 0. **The data is tiny; the schema sprawl is the debt.** Consolidation is cheap *now* and expensive later.

| Generation | Schemas / prefix | Era | Status |
|---|---|---|---|
| gravrcc_v6 | `public.*` (participants, coaching_sessions, assessments, recovery_capital, wellness_checkins, rtu_events, slogans, icare_plans, peer_circles, outcomes, resources, organizations, programs) | May 2026 | Partially used by MVP (participants, barc10) |
| gfa_core / gfa_ui | `gfa_core.*` (participants #2, coaches, navigators, volunteers, lookups), `gfa_ui.*` (~70 app tables incl. residents, garden_plants, grace_sessions) | Jun 2026 | Mostly empty; RLS on |
| Identity seam | `gfa_identity.participant_crosswalk`, `v13_two_program_identity_seam`, `pathc_*` enrollment gates | Jun–Jul 2026 | **Exactly the person/relationship separation the mandate requires — already started** |
| MVP | `public.mvp_*` + Gate 19B columns | Jul 2026 | **LIVE** |
| Residence | `gfa_residence.*` + `gracehouse_*` policy/documents/signatures | Jun–Jul 2026 | Well-modeled, scaffolded |
| v2 | `public.v2_*` | Jul 22 | Working, demo data |
| Quantum Bridge | `mvp_*` extensions, `coach_meeting_rooms` | Jul 22–23 | Active workstream |

**Verified duplications in the live database:**
- **Check-ins ×7:** `gfa_ui.check_ins`, `gfa_ui.daily_check_ins`, `gfa_ui.weekly_check_ins`, `gfa_ui.check_in_records`, `public.wellness_checkins`, `public.daily_pulse`, `public.v2_daily_checkins`
- **Sessions ×4:** `public.coaching_sessions`, `gfa_ui.coaching_sessions`, `public.mvp_sessions`+`mvp_session_requests` (extended by Quantum Bridge), `public.v2_session_requests`
- **Housing/beds ×4:** `gfa_residence.beds`(17), `public.residence_beds`(8), `public.v2_housing_beds`(8), plus `public.housing_applications` vs `gfa_ui.housing_entries` vs `public.v2_housing_applications`
- **ICARE ×2:** `public.icare_plans`, `gfa_ui.icare_plans`
- **BARC-10 ×2:** `public.barc10_assessments` (live data), `gfa_ui.barc10_assessments`
- **Resources ×3:** `public.resources`, `gfa_ui.resources`, `public.v2_resources`
- **Participant identity ×4:** `public.participants`, `gfa_core.participants`, `gfa_ui.participant_profiles`, `public.participant_profiles` (+ `public.v2_profiles`), bridged by `gfa_identity.participant_crosswalk`
- **Role helpers ×8:** `get_my_role()`, `my_role()`, `get_vrcc_user_role()`, `is_admin()`, `is_coach()`, `gfa_core.is_staff()`, `gfa_ui.my_participant_id()`, `v2_my_role()`
- **Grace AI ×3 + gateways ×2 (edge functions):** `grace-companion`, `grace-companion-v6`, `Grace`; `vrcc-api-gateway`, `vrcc-api-gateway-v6`

---

## 3. Signature-feature location check

| Feature | Frontend in vrcc.app | Backend in live DB | Where it actually is |
|---|---|---|---|
| 59 Slogans / slogan engine | absent | ✅ `recovery_slogans`, `slogan_practices`, `gfa_ui.slogans`, `slogan_recommendations` + `slogan-engine` edge fn | Backend real, no shipped UI |
| ICARE plans | absent | ✅ `icare_plans` ×2 | Backend real, no shipped UI |
| Recovery capital / BARC-10 | ✅ live (MVP Barc10) + dormant legacy `Assessment.jsx` | ✅ (incl. BARC-10 domains) | Live |
| Grace AI | dormant legacy `GraceChat.jsx` | ✅ 3 edge-fn generations | Backend live, UI dormant |
| Support Now / crisis | ✅ live (`SupportNow.jsx`) | `crisis_resources`, `gfa_ui.crisis_*` | Live |
| Brain Atlas | **absent** | not found | UNVERIFIED — likely `grace-harbor-16` or another repo |
| Recovering the Mind / Training the Mind | **absent** | not found | UNVERIFIED — same |
| The Tapes We Carry | **absent** | not found | UNVERIFIED — same |
| Daily practice (GROW/BDNF/mycelium) | v2 branch only | ✅ `v2_daily_checkins` | Built, undeployed |
| Residence ops (policy, documents, signatures, NARR) | gracehouse branch scaffold | ✅ `gfa_residence.*` + policy engine | Backend strong, UI early |

---

## 4. Known factual corrections (content debt)

- **Geography:** v2's UI copy and seed data say "Virginia Recovery Connection Center", "Wise County, Southwest Virginia". **Canonical truth (gracehouse buildout plan): Grace For Addictions is Des Moines, Iowa; Grace House = 1311 9th Street, Des Moines, IA 50314; women-focused, NARR Level II-aligned ("preparing for", never "certified"); VRCC = *Virtual* Recovery Community Center.** The v2 seed must be corrected or superseded during consolidation.
- The gracehouse branch carries a **canonical truth register** (fees, curfew by phase, MOUD-affirming rules, prohibited language) and a **decision register** (GH-D003/4/13/15/100/101). Treat these as governing content facts for anything residence-related.

---

## 5. Active parallel workstreams (governance risk)

Three build streams touched the **live production DB** within the last 48 hours, mutually unaware:

1. **Quantum Bridge** — `vrcc_quantum_bridge_v3` (Jul 22 15:39), `vrcc_grace_house_seed_and_ooma_fix` (Jul 23 05:29) + redeployed `create-meeting` edge fn (Jul 23) — building sessions/housing **on mvp_***.
2. **v2** (this session) — `v2_foundation`/`v2_go_live`/`v2_advisor_hardening` (Jul 22 16:33–16:35) — building sessions/housing **on v2_***.
3. **Grace House** — `gracehouse_*` (Jul 22 17:47–17:51) — building residence ops **on gfa_residence/public**.

The Cloudflare worker was also redeployed Jul 23 06:10. **Phase 0 of the migration plan (freeze uncontrolled feature expansion) applies to all three streams, including this one.**

---

## 6. Preliminary architecture read (Option C leaning — NOT final)

- The **shared foundation already exists in embryo**: one Supabase project, an identity crosswalk, program-enrollment gates, a residence schema, a recovery-capital engine, a slogan engine, Grace AI functions. Nobody needs to invent the RecoveryOS platform layer — it needs to be *chosen, unified, and named* out of the five competing generations.
- The **live MVP is the best participant shell seed**: small, coherent, guided (one next step), crisis always available. It already embodies "simple on the surface."
- The **residence experience should be a separate shell** on the shared foundation (gracehouse direction), per the mandate's participant/resident distinction — which the DB's identity-seam work already anticipates.
- **Total rebuild is not indicated.** The evidence says: archive the legacy Base44 app (dead weight, already unmounted), pick ONE canonical implementation per capability, and grow shells from the MVP + gracehouse seeds.

**DECISION REQUIRED (owner):**
- D-1: Which sessions/housing implementation is canonical — `v2_*`, Quantum-Bridge `mvp_*`, or `gfa_residence` (for residence beds)? The three cannot coexist.
- D-2: GH-D100 (residence frontend stack) and GH-D101 (dev-branch discipline for prod schema) from the gracehouse decision register.
- D-3: ~~`RecoveryResidenceOS`~~ (audited 2026-07-23: empty placeholder repo). Remaining: `grace-harbor-16` (GFAVRCC) and `GFA-ECO` (rcoiowa) are in **different GitHub orgs** and cannot be added to a Grace-For-Addictions-scoped session — auditing them requires starting a session with each as an initial source. Also confirm `contact-connect-dashboard`, `Late-Night-Recovery-`, `icrco` status.

---

## 7. Next audit steps (in order)

1. **Complete the app map:** add the three unaudited repos to a session and inventory them (locates Brain Atlas / Recovering the Mind / Tapes We Carry, and whatever RecoveryResidenceOS duplicates).
2. **Deliverable 3 — Feature Master Inventory:** merge this repo's 60-page legacy catalog + MVP + v2 + gracehouse + external repos into one classified table (KEEP / CONSOLIDATE / RELOCATE / SHARED SERVICE / ARCHIVE / REMOVE).
3. **Deliverable 4 — Duplication matrix** (started in §2 above) with a recommended canonical implementation per capability.
4. **Deliverables 5–9** (personas, seven-area navigation, journeys, target architecture, migration plan) once D-1/D-2/D-3 are decided.
