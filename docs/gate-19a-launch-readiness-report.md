# Gate 19A — Participant + Coach Launch Readiness Report

**Mode:** Participant + Coach Launch Readiness. Audit only. No implementation.
**Invariant target:** every participant has a next step; every required next step has
an owner; every human follow-up has a due state; every overdue/missed connection
returns to someone's attention.

> **Evidence + scope note.** DB facts below were verified live against Supabase
> project `ykykeioydvtxpyreshhs` ("Grace For Addictions") earlier in this session.
> This turn, live re-verification (advisors, migrations, fresh SQL) was **blocked**
> — the Supabase MCP instance returned `-32600: permission denied`. Items needing
> the running app's frontend code are marked **[NEEDS FRONTEND REPO]**: `vrcc.app`
> (this repo) is the **base44 legacy stack** and is *not* the `gfa_*` launch app, so
> first-login/coach flow tracing cannot be done here. The launch frontend is a
> separate repo (candidate `GFAVRCC/grace-harbor-16`) that must be named/authorized
> before Parts B/C/D and the frontend halves of E–I can be closed.

---

## A. Exact production project targeted by the repo

- **This repo (`vrcc.app`) targets base44, not Supabase.** Verified: no `.env`,
  `.env.example`, `wrangler.toml`, Cloudflare/Vercel config; the only env var read is
  `import.meta.env.VITE_BASE` (a base44 param). No `VITE_SUPABASE_*`, no project ref,
  no `*.supabase.co` URL anywhere in the tree.
- **The `gfa_*` launch backend is Supabase project `ykykeioydvtxpyreshhs`** (region
  us-west-2, ACTIVE_HEALTHY). Sibling projects in the org: `GRAVRCC-dev`
  (`gffosjyiunshhmtpjsqa`, active) and `VRCC-10x Project` (`yqonwnzqtgmnoiymkefk`,
  inactive).
- **Which project the launch *frontend* targets per environment (local/preview/prod)
  is [NEEDS FRONTEND REPO].** It cannot be read from this repo. To close Part 1,
  inspect the frontend's `.env*`, Supabase client init, and CI/Cloudflare config for
  the project ref (`ykyk…` vs `gffo…`). No secret values will be reported.

## B. Actual first-login participant flow — **[NEEDS FRONTEND REPO]**
Cannot be traced against `vrcc.app` (base44, wrong stack). To close, trace in the
`gfa_*` frontend: route → guard → component → hook/query → table/RLS → advance
condition → empty state, for: account creation → auth → profile resolution → role
resolution → incomplete-profile check → onboarding → completion flag → first home.
The 10 sub-questions (what they see, what marks onboarding complete, can they
request coaching/navigation, Support Now, stuck points) all depend on that code.
*DB substrate that the flow will bind to exists:* `gfa_ui.participant_profiles`,
`gfa_ui.access_requests`, `gfa_ui.consent_records`, `gfa_ui.support_requests`.

## C. Actual subsequent-login participant flow — **[NEEDS FRONTEND REPO]**
What the participant home prioritizes on later logins is a frontend decision not
present in this repo. *DB substrate for a "primary next action" exists and is
purpose-built* — see Part F (`gfa_ui.goals.small_step`). Whether the home currently
renders it, and whether one single recommended action is surfaced, is
frontend-dependent.

## D. Actual coach daily flow — **[NEEDS FRONTEND REPO]**
Coach login → dashboard → caseload → participant workspace → session →
documentation → action step → follow-up → next contact cannot be traced here.
*DB substrate exists* for every element the 8 coach questions ask about:

| Coach need | Existing table (Supabase) |
|---|---|
| caseload / assignment | `gfa_ui.coach_profiles`, coach↔participant linkage (verify FK) |
| session + documentation | `gfa_ui.coaching_sessions` (0 rows) / `gfa_engagement.sessions` (27 rows) |
| agreed action step | `gfa_ui.goals.small_step` |
| follow-up due | `gfa_engagement.sessions.follow_up_due` |
| support needs | `gfa_ui.support_requests` |
| alerts / attention | `gfa_ui.coach_alerts` |
| booking / upcoming | `gfa_session.booking_requests`, `gfa_ui.coaching_sessions.scheduled_at` |
| inactivity | `gfa_ui.daily_check_ins` / `participant_pulse` (last-activity) |

Whether the coach UI actually reads these — and the answer to "can a meaningful
session end without any next action or follow-up state?" — is frontend-dependent.
**DB-level answer to that last question: YES, it can.** `follow_up_due` is nullable
with no NOT NULL/trigger enforcement, and `gfa_ui.coaching_sessions` has no
follow-up column at all — nothing forces a next step at session close today.

## E. Existing canonical follow-up mechanism — **verified (DB)**

- **`gfa_engagement.sessions.follow_up_due` (`date`) EXISTS.** 27 session rows;
  **6 populated**. Confirmed live earlier this session. **Do not create a duplicate.**
- **It is session-level, not relationship-level.** It hangs off a specific session
  row (integer-keyed, with `icare_phase_id`, grant-billing fields, `lifecycle_status`,
  `note_tier`, `requested_by_id/requested_at`).
- **No writer exists in the DB layer** — no trigger, function, or view references
  `follow_up_due`. The 6 values are seed/backfill. **Frontend write path: [NEEDS
  FRONTEND REPO]** — but the UI session surface (`gfa_ui.coaching_sessions`, 0 rows)
  has **no** follow-up column, so a UI writing there cannot populate it. This is the
  layer split that orphans the field.
- **In migrations?** [NEEDS DB ACCESS] — `list_migrations` was permission-blocked
  this turn; the field's presence in a shipped migration should be reconfirmed once
  access is restored (or read from the frontend repo's `supabase/migrations`).
- **Can it support the launch workflow?** Yes for *session-anchored* follow-up. A
  **relationship-level** follow-up field is **not required** if the rule is
  "latest open session's `follow_up_due` = the participant's due state." A separate
  relationship field would only be justified if follow-up must persist independent of
  any session (e.g., pre-first-session outreach). Recommend reusing the session field
  plus a "latest per participant" read, not a new column.

## F. Existing canonical next-step / action mechanism — **verified (DB)**

- **`gfa_ui.goals.small_step` (`text`) EXISTS** with `target_date` and `status`,
  on the frontend `gfa_ui` schema (uuid-keyed: `id, participant_id, title,
  description, small_step, target_date, status`). Live sample row:
  `small_step="Apply", status="active"`. **This is the purpose-built,
  participant-facing next agreed action.** Reuse it.
- **Overlapping candidates** (why "canonical" needs the frontend to confirm usage):
  - `gfa_icare.icare_steps` + `gfa_ui.icare_step_entries` — structured ICARE-plan
    steps (also `gfa_engagement.sessions.icare_phase_id`). Program-methodology steps,
    not the single next action.
  - `gfa_ui.journey_events` — event log (history), not a forward action.
  - `gfa_ui.milestones` — achievements, not next action.
  - `gfa_ui.support_requests` — participant help asks, not an agreed step.
  - base44 legacy: `MenteeGoal` / `UserProfile.current_goal` / `GFAPlan` (this repo)
    — **do not use**; wrong stack.
- **Recommendation:** `gfa_ui.goals.small_step` is the canonical next agreed action;
  `icare_step_entries` is the methodology layer beneath it. Which one the live home
  renders is **[NEEDS FRONTEND REPO]**, but the schema intent is unambiguous
  (`small_step` on the UI `goals` table with a `target_date` and `status`).

## G. Participant fall-through points
- **[DB-level, confirmed]** No mechanism forces a participant to *have* a next step:
  `gfa_ui.goals` has 1 row total across the project — the goal/next-step surface is
  effectively unpopulated. A participant can exist with **no `small_step`** → violates
  the invariant.
- **[NEEDS FRONTEND REPO]** Onboarding-completion gaps, empty-state dead-ends, and
  "no primary next action on home" require the frontend to confirm.

## H. Coach fall-through points
- **[DB-level, confirmed]** (1) A session can be documented with `follow_up_due` NULL
  (6/27 set) → no due state. (2) The UI session table has no follow-up column at all.
  (3) No producer converts overdue `follow_up_due` into a `coach_alert` → overdue
  follow-ups **do not** return to attention automatically. (4) `gfa_ui.coach_alerts`
  exists but is not fed by follow-up state.
- **[NEEDS FRONTEND REPO]** "Can a coach see who is new / never contacted / stopped
  engaging / their next step / due follow-ups" depends on whether the coach UI queries
  the tables in Part D.

## I. Security issues that block real participant onboarding
- **[DB-level, confirmed earlier]** `gfa_ui.*` tables are granted **`anon` + `authenticated`
  CRUD** with RLS enabled (e.g., `gfa_ui.goals`: anon+authenticated
  SELECT/INSERT/UPDATE/DELETE). Security therefore rests entirely on RLS policy
  quals, not on grants. `gfa_engagement.sessions` is `authenticated`-only (better).
- **Part 7 named tables** (`icare_plans`, `outcomes`, `peer_circles`,
  `resource_referrals`, `slogan_practices`) — the prior DB audit you cite found
  **org-wide `authenticated` read policies**. **Re-enumerating their exact policy
  quals was permission-blocked this turn** and should be reconfirmed. **Whether
  participant-facing code queries them directly is [NEEDS FRONTEND REPO].**
- **Assessment:** an org-wide `authenticated USING (true)` read policy is a **real
  cross-participant data-exposure risk** at launch *if* those tables hold
  participant-identifiable data and any authenticated participant can select all rows.
  This is plausibly launch-blocking, but confirming (a) the exact quals and (b) that
  the frontend exposes the data path requires restored DB access + the frontend repo.
  **Policies not changed, per instruction.**

## J. Minimum launch-blocking changes (from confirmed evidence)
1. **Guarantee a next step exists per active participant** — populate/require
   `gfa_ui.goals.small_step` (reuse; no new table).
2. **Make follow-up writable from session close** — resolve the
   `gfa_engagement.sessions` ↔ `gfa_ui.coaching_sessions` layer split so the UI can
   set `follow_up_due` (reuse the existing column; decide write-target/sync).
3. **Feed the attention queue** — add the *only* genuinely missing piece: a producer
   that turns overdue `follow_up_due` into a `gfa_ui.coach_alert`.
4. **Confirm/patch the org-wide read policies** on the Part 7 tables before onboarding
   real participants (after re-verification).

## K. Exact proposed Gate 19B (draft — DB layer specified; frontend pending repo)

**Principle: reuse existing infrastructure; no new tables.** Everything the loop
needs already exists (`goals.small_step`, `sessions.follow_up_due`, `coach_alerts`,
`participant_crosswalk`, and RLS for all of it). Net-new = one read surface + one
producer + frontend wiring.

- **Database changes (reuse-first):**
  - *No new tables.* Do **not** add a relationship-level follow-up field (Part E).
  - Add **one attention read surface**: a view (or scheduled function) selecting
    participants whose latest session `follow_up_due <= current_date` and no
    resolved contact since — feeding `gfa_ui.coach_alerts` (or queried directly).
  - Add **one producer**: convert overdue `follow_up_due` → `coach_alerts` row
    (`alert_type='follow_up_overdue'`, `priority`, `requires_response_within_hours`).
    Implement as a Supabase scheduled (pg_cron) function or an edge function.
  - Identity join uses `gfa_identity.participant_crosswalk`
    (`participant_id uuid ↔ core_participant_id int`) to bridge `gfa_ui.goals`
    (uuid) ↔ `gfa_engagement.sessions` (int).
- **Frontend changes — [NEEDS FRONTEND REPO] (exact files pending):**
  - Participant home: read `gfa_ui.goals` (RLS `goals_self`) and render the single
    `small_step` (+ `target_date`, `status`) as the primary next action.
  - Session-close (coach): write `gfa_ui.goals.small_step` (RLS `goals_coach_w/u`)
    **and** `follow_up_due` on the session (RLS `p_staff_all`).
  - Coach workspace: render the attention queue from `coach_alerts` / the view.
- **RLS implications:** the needed policies already exist — `goals_self[SELECT]`,
  `goals_coach[INSERT/UPDATE]`, `sessions.p_staff_all[ALL]`,
  `sessions.p_participant_own[SELECT]`. The new view/producer must run with a role
  that can read across participants (service/definer) while participant-facing reads
  stay constrained by `goals_self` / `p_participant_own`. Separately, **tighten the
  Part 7 org-wide read policies** before launch.
- **Verification tests:**
  1. Participant with an open goal sees exactly one `small_step` on home; participant
     with none sees a defined empty state (invariant check).
  2. Coach sets `small_step` + `follow_up_due` at session close → both persist under
     coach RLS.
  3. A session saved with `follow_up_due` in the past → producer creates a
     `coach_alert` → appears in coach attention queue.
  4. RLS negative test: participant A cannot select participant B's `goals` /
     `sessions` (and re-test the Part 7 tables).
  5. Overdue alert resolves when a new contact/session is logged.

---

## Blockers to close Gate 19A → 19B
1. **Name/authorize the `gfa_*` launch frontend repo** (candidate
   `GFAVRCC/grace-harbor-16`) so Parts B, C, D and the frontend halves of E, F, I can
   be traced against real code.
2. **Restore Supabase access** (advisors + `list_migrations` were permission-blocked
   this turn) to reconfirm `follow_up_due` in migrations and enumerate the Part 7
   policy quals.

**No implementation performed. Gate 19B not started — awaiting explicit approval.**
