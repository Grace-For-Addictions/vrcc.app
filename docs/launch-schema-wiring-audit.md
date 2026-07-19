# Launch Schema Wiring Audit

**Scope:** Resolve the six wiring questions for the launch continuity loop
(session close → next action → participant home → coach attention → overdue return),
reconciled across **both** live backends.

> **CORRECTION (supersedes the first revision of this doc).** The first revision
> concluded that `follow_up_due` / `small_step` "do not exist." That was true only
> of *this repository's code* and was misleading. **They do exist** — in the live
> **Supabase "Grace For Addictions"** database. This repo (`vrcc.app`) is a
> *separate* base44 stack that does not connect to Supabase. Decision on record:
> **the launch target is the Supabase `gfa_*` stack**, not this base44 app.

---

## The two-stack reality

| | **base44 (`vrcc.app`, this repo)** | **Supabase "Grace For Addictions"** (`ykykeioydvtxpyreshhs`) |
|---|---|---|
| Frontend SDK | `@base44/sdk` | none in this repo — consumed by a *different* repo (candidate: `GFAVRCC/grace-harbor-16`) |
| Session record | `CoachingSessionLog` entity | `gfa_engagement.sessions` (27 rows) + `gfa_ui.coaching_sessions` (0 rows) |
| Goal / next action | `MenteeGoal` / `UserProfile.current_goal` / `GFAPlan` | `gfa_ui.goals` (1 row) |
| `follow_up_due` | ❌ no such field | ✅ `gfa_engagement.sessions.follow_up_due` (`date`, 6/27 populated) |
| `small_step` | ❌ no such field | ✅ `gfa_ui.goals.small_step` (`text`, 1/1 populated) |
| Attention queue | `ProgressInsight.severity` | `gfa_ui.coach_alerts` (built, not fed by follow_up_due) |
| icare | none | `gfa_icare.icare_steps` (canonical) + `gfa_ui.icare_step_entries` (+ `ztest.icare_steps`, test dupe) |

**`vrcc.app` is the legacy stack.** The normalized `gfa_*` schema (and the sibling
Supabase projects "VRCC-10x Project", "GRAVRCC-dev") is the "10x" rebuild the
launch runs on. Everything below answers the six questions against **Supabase**.

---

## The internal split that orphans `follow_up_due`

Supabase itself has two session tables:

- **`gfa_engagement.sessions`** — normalized reporting/grant-billing layer.
  Integer-keyed. Holds `follow_up_due`, `icare_phase_id`, `grant_billable`,
  `exhibit_e_activity_code`, `goals_reviewed`, strengths/growth, `lifecycle_status`,
  `note_tier`. **27 rows; 6 have `follow_up_due` set.** Grants: `authenticated`
  CRUD. RLS: `p_staff_all[ALL]`, `p_participant_own[SELECT]`, `p_session_request_own[INSERT]`.
- **`gfa_ui.coaching_sessions`** — frontend UI surface. UUID-keyed. Has `status`,
  `scheduled_at`, `session_notes`, `coach_internal_notes` — **but no follow-up
  field, and 0 rows.** Grants: `anon`+`authenticated` CRUD.

They are **independent** (no FK, no trigger, no view links them). So a UI that
writes sessions through `gfa_ui.coaching_sessions` can never populate
`gfa_engagement.sessions.follow_up_due` — which is exactly why the field reads but
is not written. The 6 populated rows are seed/backfill on the engagement layer.

Identity bridge for the loop's join: `gfa_ui.goals.participant_id` is `uuid`,
`gfa_engagement.sessions.participant_id` is `integer`; they reconcile through
**`gfa_identity.participant_crosswalk`** (`participant_id uuid ↔ core_participant_id int`,
with `match_method`/`confidence`). The loop must route participant identity through
this crosswalk.

---

## The six questions — answered against Supabase (the launch target)

1. **Which implementation does the frontend read?** The `gfa_ui.*` schema is the
   frontend API surface (anon/authenticated grants, RLS). Participant-facing next
   action = `gfa_ui.goals` (`goals_self[SELECT]` policy). This repo's base44
   frontend reads base44 entities instead and is not the launch frontend.

2. **Which does it write?** `gfa_ui.*` (goals, coaching_sessions, coach_alerts…).
   `gfa_engagement.sessions` is written by staff/back-office paths, not the UI
   session surface. Nothing — no DB routine, trigger, or view — writes
   `follow_up_due` or `small_step`; those are direct-table writes only.

3. **Dead / legacy?** The whole **base44 stack (this repo) is the legacy stack.**
   Within Supabase: `ztest.*` (incl. `ztest.icare_steps`) is a test schema — ignore.
   `gfa_ui.coaching_sessions` is an unpopulated stub (0 rows) — not yet wired.

4. **Why is `follow_up_due` read but never written?** Because it lives on the
   normalized `gfa_engagement.sessions` layer, while the UI session surface is the
   separate `gfa_ui.coaching_sessions` table that lacks the field. No trigger/view
   bridges them. The write path simply isn't wired across the two layers.

5. **Can session close safely write `follow_up_due`?** Yes — the column is nullable,
   RLS already permits staff writes (`p_staff_all`), no constraints/triggers to
   violate. The open question is *architectural, not safety*: should session close
   write `gfa_engagement.sessions.follow_up_due` directly, or should `follow_up_due`
   be surfaced onto `gfa_ui.coaching_sessions` (the UI layer) and synced down? Reuse
   the engagement column; decide the sync direction.

6. **Can participant home surface `small_step` as the primary next action?** Yes —
   `gfa_ui.goals.small_step` is purpose-built for it, on the UI schema, and RLS
   already grants the participant read of their own goals (`goals_self`). No schema
   work needed for the read; the surface just needs a frontend that queries it.

---

## Loop wiring: what exists vs. what's missing (Supabase)

| Loop step | Existing infrastructure | Gap to wire |
|---|---|---|
| Coach records agreed `small_step` | `gfa_ui.goals.small_step` + `goals_coach[INSERT/UPDATE]` RLS | frontend write in session-close UI |
| Coach sets `follow_up_due` | `gfa_engagement.sessions.follow_up_due` + `p_staff_all` RLS | UI session table lacks the field → decide layer/sync |
| Participant home surfaces `small_step` | `gfa_ui.goals` + `goals_self[SELECT]` RLS | frontend read on participant home |
| Attention queue watches `follow_up_due` | `gfa_ui.coach_alerts` (priority, response-window, ack/resolve) | **no producer**: nothing turns overdue `follow_up_due` into a `coach_alert` |
| Overdue returns participant to attention | `coach_alerts.status` lifecycle | the scheduled job/view that scans `follow_up_due <= today` |

**Net:** the launch loop needs **almost no new schema** — `follow_up_due`,
`small_step`, `coach_alerts`, `participant_crosswalk`, and the RLS for all of it
already exist. The real work is (a) a **frontend** (not this repo) that reads/writes
`gfa_ui.goals` + a session surface, (b) resolving the `gfa_engagement.sessions` vs
`gfa_ui.coaching_sessions` layer split so `follow_up_due` is writable from session
close, and (c) a **producer** that converts overdue `follow_up_due` into
`gfa_ui.coach_alerts`. That is an implementation gate, in the `gfa_*` frontend repo.

---

## Note on the smoke test
Do not paste console snippets that read auth tokens from `localStorage`. On the
Supabase stack, exercise the loop through the app's Supabase client (respecting
RLS as the real `authenticated` role) or a scoped service-role test harness — never
a hand-extracted bearer token.

---

## Appendix — base44 (`vrcc.app`) internal audit (legacy stack, for reference)

Retained because it documents the stack being replaced. On base44 the loop would
be blocked by: a three-way `MenteeGoal.status` vocabulary mismatch (create sets
none; `ParticipantDashboard` reads `in_progress`/`achieved`; `CoachDashboard` +
`BeePurpleReporting` read `active`/`completed`); a missing `Plus` import crashing
`ParticipantDashboard`'s goals card (`ParticipantDashboard.jsx:183`); a dead "Next
Session" card reading `session_date`/`coach_email` from a log storing
`activity_date`/`coach_name`; and a split-brain `CoachingSession` (written only by
the VR training simulator) feeding empty data to 5 AI features. These matter only
if base44 remains in service during transition.
