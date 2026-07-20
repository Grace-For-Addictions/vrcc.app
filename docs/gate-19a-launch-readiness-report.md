# Gate 19A — Participant + Coach Launch Readiness Report

> **STATUS UPDATE — Gate 19B APPROVED & IMPLEMENTED.** The minimum continuity loop
> from Part K is implemented on branch `claude/vrcc-refine` (commit `00a7801`) and its
> migration has been **applied** to project `ykykeioydvtxpyreshhs`. Verified: `eslint
> src/mvp` clean, `vite build` passes. **Two security items below remain OPEN and
> launch-blocking** — RLS on the `mvp_*` surface (I) and the `gfa_*` org-wide read
> policies (I2) — because live DB access stayed permission-denied; ready-to-run
> verification SQL is in the new "Open security verification" section at the end.

**Mode:** Participant + Coach Launch Readiness. **Audit + approved Gate 19B.**
**Invariant target:** every participant has a next step; every required next step has
an owner; every human follow-up has a due state; every overdue/missed connection
returns to someone's attention.

> **Decisive scope correction (supersedes earlier revisions).** The launch app is
> **not** the base44 code on `main`, and it does **not** use the `gfa_*` Supabase
> schema. It is a focused **MVP** on branch **`claude/vrcc-refine`**, in `src/mvp/`,
> mounted directly by `src/main.jsx` (`<MvpRoot/>`, base44 `App.jsx` bypassed). It
> targets Supabase project **`ykykeioydvtxpyreshhs`** and uses its **own minimal
> `public` tables**: `participants`, `participant_intakes`, `barc10_assessments`,
> `mvp_sessions`, `mvp_session_requests`, `mvp_messages`, `peer_coaches`, plus RPC
> `get_my_role` / `app_users`. **`gfa_engagement.sessions.follow_up_due` and
> `gfa_ui.goals.small_step` exist in the DB but are UNUSED by the launch app** —
> they belong to a separate, unfinished model. The launch loop must be built on the
> `mvp_*` model, not `gfa_*`.

> **Verification limits this turn:** live Supabase re-query was permission-blocked
> (`-32600`), and the repo contains **no migration SQL**, so RLS policy quals and
> the `gfa_*` exposure could not be freshly re-enumerated. Those items are marked
> **[VERIFY IN DB]** and rely on facts captured earlier this session.

---

## A. Exact production project targeted by the repo

- **Project `ykykeioydvtxpyreshhs`** (`https://ykykeioydvtxpyreshhs.supabase.co`),
  set in `src/mvp/supabase.js` as a hardcoded fallback plus optional
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` overrides.
- **Single project for all environments** (local/preview/prod) unless env vars
  override — no separate dev/preview project is wired. `PROJECT_REF = 'ykykeioydvtxpyreshhs'`.
- Auth uses the **publishable (anon) key, shipped in the client bundle** — public by
  design; **RLS is the only access control.** (Comment in `supabase.js` says so.)
- No `.env.example`, no Cloudflare/wrangler config on the branch.

## B. Actual first-login participant flow

Route/guard model is a single-page role switch in `MvpRoot.jsx` (no router); gates
are component-level.

| Step | Code | Table / call | Advance condition | Empty/failure |
|---|---|---|---|---|
| Landing | `Landing.jsx` | — | click Get Started | — |
| Auth | `SignIn.jsx` | `supabase.auth.signUp` / `signInWithPassword` (email+password; `user_metadata.first_name`) | session created | signup w/ email confirm → "Check your email to confirm" notice, no session |
| Session+role | `MvpRoot.handleSession` → `resolveRole` | `rpc('get_my_role')` (reads `app_users.role`, default `participant`) | role resolved | rpc fails → defaults `participant` |
| Participant record | `ParticipantApp` → `ensureMyParticipant` | `participants` upsert (`org_id='gfa'`, `intake_complete=false`, `barc10_complete=false`) | row exists | insert error → ErrorScreen |
| Onboarding 1 | `Intake.jsx` | insert `participant_intakes`; update `participants.intake_complete=true` | submit (name + DUA consent required) | validation / insert error inline |
| Onboarding 2 | `Barc10.jsx` | insert `barc10_assessments`; update `participants.barc10_complete=true, barc10_score` | all 10 items answered | error inline |
| Home | `ParticipantHome` | `mvp_sessions`, `mvp_session_requests` (filter `participant_email`) | — | "No sessions scheduled yet" |

**Answers:** 1) First-timer sees the **Intake** form ("Step 1 of 2"). 2) Must complete
**Intake** (first/last name + data-use consent required) then **BARC-10** (all 10
items). 3) **Yes**, leave & return — completion flags persist on `participants`;
partial onboarding isn't saved (single-submit forms) but the gate resumes at the
right step. 4) Onboarding complete = `intake_complete` **and** `barc10_complete` true.
5) Immediately after: BARC-10 **soil-type result** screen → "Enter the community" →
`ParticipantHome`. 6) **No clear primary next action** — home shows a recovery-capital
snapshot, coach card, and sessions; there is **no goal/next-step concept**. 7) **Cannot
request coaching** — matching is coach-initiated (coach "claims" from Unmatched); the
participant only waits. 8) **No navigation** concept exists. 9) **No Support Now /
crisis path exists anywhere** — launch-safety gap. 10) **Stuck points:** email-
confirmation wall (if enabled) with only a text notice; **post-onboarding "no coach"
limbo** with no actionable step; **no crisis path**; long intake is all-or-nothing.

## C. Actual subsequent-login participant flow

`MvpRoot` resolves session+role → `ParticipantApp` → `ensureMyParticipant` → (flags
true) → `ParticipantHome`, which polls `mvp_sessions` + `mvp_session_requests` every
6 s. Home prioritizes, in order: **recovery-capital soil snapshot**, **coach + 1:1
messaging** (if `assigned_coach_email` set), **sessions** (upcoming list + a "request
a session" box, enabled only when a coach is assigned).

**Can the system show one primary recommended next action? No.** Searched the MVP for
next action / next step / action step / follow-up / follow_up_due / goals / tasks /
support requests / ICARE / check-ins / inactivity / notifications / coach assignment —
**none exist** except: coach assignment (`participants.assigned_coach_email`), sessions
(`mvp_sessions`), and session requests. The closest thing to a "next action" is
"request a session," which is **unavailable until a coach claims the participant**.
**The invariant "every participant has a next step" is not met.**

## D. Actual coach daily flow

`CoachApp.jsx` — four tabs, polled every 6 s:

- **Unmatched** = `participants` where `assigned_coach_email IS NULL AND
  intake_complete = true`, oldest first. **Claim** → `participants.update(assigned_coach_email/name)`.
- **My participants** = `participants` where `assigned_coach_email = me`.
- **Requests** = `mvp_session_requests` where `coach_email=me, status='pending'` →
  schedule inserts `mvp_sessions(scheduled_at, status='scheduled')` and marks request scheduled.
- **Upcoming** = `mvp_sessions` where `coach_email=me`, not cancelled.
- **ParticipantPanel** (detail) = soil snapshot + **Messaging only**. No documentation,
  notes, goal, next step, follow-up, or session outcome.

**Answers:** 1) See every assigned participant — **Yes** (My participants). 2) Who is
new — **Partial** (Unmatched shows unassigned oldest-first; no "new" flag among mine).
3) Never contacted — **No** (no last-contact tracking). 4) Whose follow-up is due —
**No** (no follow-up field in the MVP). 5) Next agreed step — **No** (no next-step
field). 6) Open support needs — **Partial** (pending session requests + free-text
note). 7) Who stopped engaging — **No** (no inactivity/last-activity indicator). 8)
**Can a meaningful session end with no next action / follow-up state? Yes, always** —
`mvp_sessions` is only a calendar entry (`scheduled`/`cancelled`); there is no
completion, outcome, next step, or follow-up. **This is the core invariant violation.**

## E. Existing canonical follow-up mechanism — **none in the launch app**
`mvp_sessions` has `scheduled_at` + `status` only; no follow-up field.
`gfa_engagement.sessions.follow_up_due` exists in the DB (verified earlier: 6/27
populated, no writer) but the MVP never references `gfa_*`. **In migrations:** no SQL
in repo; DB `list_migrations` [VERIFY IN DB]. **A relationship-level follow-up field
is genuinely required** — none exists in the launch model, and reusing the `gfa_*`
field would couple the minimal MVP to a separate unfinished schema (not advisable).

## F. Existing canonical next-step / action mechanism — **none in the launch app**
No goal / action-step / journey-event / ICARE / support-plan tables in the `mvp_*`
model. `gfa_ui.goals.small_step` exists in the DB but is unused by the MVP. **No
canonical next agreed step exists in the launch app; one must be introduced in the
`mvp_*` model** (see K). There is nothing to "reuse" within the launch model.

## G. Participant fall-through points
1. **Post-onboarding "no coach" limbo** — no actionable step; indefinite passive wait
   (only a reassurance message).
2. **No next step is ever surfaced** → invariant fail on every login.
3. **No Support Now / crisis path** anywhere (pre- or post-auth).
4. **Email-confirmation wall** (if enabled) with only a text notice.
5. Intake / BARC-10 are single-submit (no partial save) — a long intake is lost on
   error or navigation.

## H. Coach fall-through points
1. **No next-step / follow-up capture at all** → sessions end with nothing owed (H8).
2. **No inactivity indicator** → silently disengaging participants are invisible.
3. **No "never contacted" indicator.**
4. **Onboarding-incomplete signups are invisible to coaches** — Unmatched requires
   `intake_complete = true`, so a participant who stalls mid-onboarding is surfaced to
   **no one**.
5. No caseload balancing / assignment beyond self-claim.

## I. Security issues that block real participant onboarding
1. **RLS is the entire security boundary** (public anon key in the bundle). Every MVP
   read filters client-side by email (e.g. `mvp_sessions.eq('participant_email',
   user.email)`) — **not security**. If `mvp_*` RLS is permissive, any authenticated
   participant can read others' data by changing the filter. **[VERIFY IN DB]** RLS on
   `participants`, `mvp_sessions`, `mvp_session_requests`, `mvp_messages`,
   `participant_intakes`, `barc10_assessments`, `peer_coaches` — **especially
   `mvp_messages` (private threads) and `participant_intakes` / `barc10_assessments`
   (PII + clinical).**
2. **Cross-schema exposure (real, launch-blocking if confirmed).** The MVP
   authenticates real participants against the **same** project that hosts the `gfa_*`
   tables carrying **org-wide `authenticated` read policies** (earlier audit:
   `icare_plans`, `outcomes`, `peer_circles`, `resource_referrals`, `slogan_practices`,
   plus broad `anon/authenticated` grants across `gfa_ui.*`). A launched participant
   holds a valid JWT and can query those tables directly via PostgREST from the
   browser, regardless of the MVP UI. **[VERIFY IN DB]** exact quals; if they hold real
   participant data, this is cross-participant exposure. **Policies not changed, per
   instruction.**
3. `claim()` updates an unassigned participant — confirm a coach cannot read/update
   participants outside their caseload, and participants cannot self-assign or read
   `peer_coaches` broadly. **[VERIFY IN DB]**
4. `ensureMyParticipant` hardcodes `org_id='gfa'` to satisfy `participants_own_insert`
   — confirm that policy also pins `supabase_user_id = auth.uid()`. **[VERIFY IN DB]**

## J. Minimum launch-blocking changes
1. Introduce a **next-step + follow-up** in the `mvp_*` model so the invariant can hold
   (K).
2. Surface **onboarding-incomplete** participants to coaches/admin so stalled signups
   aren't invisible (H4).
3. Add a **Support Now / crisis path** (static crisis resources + 988), reachable
   everywhere — launch safety (G3).
4. **Verify/tighten RLS** on all `mvp_*` tables + `participants` — the real boundary (I1).
5. **Confirm/patch the `gfa_*` org-wide read policies** before onboarding real
   participants (I2).

## K. Exact proposed Gate 19B (minimum; built on the `mvp_*` model)

Principle: keep it in the launch model; **do not couple the MVP to `gfa_*`**; no new
tables.

- **Database (smallest additive):**
  - `mvp_sessions`: allow `status='completed'`; add `coach_notes text`,
    `next_step text`, `follow_up_due date` (session documentation + agreed next step +
    due date, captured at session close).
  - `participants` (relationship rollup — one coach per participant): add
    `current_next_step text`, `next_follow_up_due date`, `last_contact_at timestamptz`.
    These power participant home + coach attention with no joins.
  - Set the rollup fields from the same coach write that completes the session (no
    trigger needed); optional trigger later.
  - **No new tables.**
- **Frontend (exact files):**
  - `src/mvp/CoachApp.jsx` → `ParticipantPanel`: add a **"Complete session / log
    contact"** form writing `mvp_sessions.status='completed'`, `next_step`,
    `follow_up_due`, `coach_notes`, and updating `participants.current_next_step`,
    `next_follow_up_due`, `last_contact_at`.
  - `src/mvp/CoachApp.jsx`: add a **"Needs attention"** tab = my participants where
    `next_follow_up_due <= today` **or** `next_follow_up_due IS NULL` **or**
    `last_contact_at < now()-N days` **or** `last_contact_at IS NULL` (new / never
    contacted / overdue / disengaged in one list). Add an **"Onboarding in progress"**
    surface for `intake_complete=false` signups.
  - `src/mvp/ParticipantApp.jsx` → `ParticipantHome`: render
    `participant.current_next_step` as the primary **"What should I do next?"** card,
    with a sensible default when null so the invariant always shows something.
  - New `src/mvp/SupportNow.jsx`: persistent crisis button (988 / crisis text /
    warmline), reachable pre- and post-auth from `MvpRoot`/headers.
- **RLS implications:** new columns inherit table RLS. Ensure coach `UPDATE` on
  `participants` covers assigned participants and `mvp_sessions`; participant `SELECT`
  on own rows already used. The attention query runs as the coach (RLS-scoped to their
  caseload). Separately, **tighten the `gfa_*` org-wide read policies** (I2).
- **Verification tests:**
  1. New participant with no coach still sees a next-step card (default) → invariant holds.
  2. Coach completes a session → `next_step` + `follow_up_due` persist and roll to
     `participants`; participant home shows the next step.
  3. `follow_up_due` in the past → participant appears in coach "Needs attention."
  4. `last_contact_at` null/stale → appears in attention (never-contacted / disengaged).
  5. RLS negatives: participant A cannot read B's `mvp_sessions` / `mvp_messages` /
     `participant_intakes` by changing the email filter; an authenticated participant
     cannot select the `gfa_*` exposed tables.
  6. Support Now reachable from every screen, including pre-auth.

---

## Required output index
A ✅ · B ✅ · C ✅ · D ✅ · E ✅ (none — required) · F ✅ (none — required) · G ✅ · H ✅ ·
I ✅ (2 items [VERIFY IN DB]) · J ✅ · K ✅.

## Gate 19B — implemented (branch `claude/vrcc-refine`, commit `00a7801`)

| Part K item | Delivered |
|---|---|
| Participant "What should I do next?" | `ParticipantApp.jsx` — always-answered next-step card (default when unset) |
| Coach attention queue | `CoachApp.jsx` — "Needs attention" tab + badges (overdue / never-contacted / quiet / no-follow-up) |
| Onboarding-incomplete visibility (H4) | `CoachApp.jsx` — "Onboarding" tab |
| Agreed next step + follow-up capture | `CoachApp.jsx` — panel form → `participants` rollup |
| Session close = contact | `CoachApp.jsx` — "Mark done" → `mvp_sessions.status='completed'` + `last_contact_at` |
| Support Now / crisis (G3) | `SupportNow.jsx` mounted globally in `MvpRoot.jsx` |
| DB (no new tables) | `supabase/migrations/20260720000000_gate_19b_continuity_loop.sql` — **applied** |

Frontend degrades gracefully if the migration is absent (next-step falls back to
default; the coach form surfaces a save error).

## Security verification — RESULTS (run against `ykykeioydvtxpyreshhs`)

Live DB access was restored; both items are now verified. **Two launch blockers.**

### 🔴 Finding 1 — core MVP tables are `RLS ENABLED` with ZERO policies → deny-all
`participant_intakes`, `barc10_assessments`, `mvp_sessions` (only the Gate 19B
`mvp_sessions_coach_update` exists), `mvp_session_requests`, `mvp_messages` all have
RLS **on** but **no SELECT/INSERT policies** → authenticated users are **denied
everything**. They also grant full CRUD (incl. DELETE/TRUNCATE) to **`anon`**.
**Evidence it's already biting:** `participants` = 16 rows, but
`participant_intakes` / `barc10_assessments` / `mvp_sessions` / `mvp_session_requests`
/ `mvp_messages` = **0 rows each**. People sign up (the `participants` insert has a
working policy), then onboarding's first write (`participant_intakes` insert) is
**denied** — so **no one can finish onboarding.** Almost certainly a side effect of
the Gate 18C RLS lockdown enabling RLS without adding policies here. **The Gate 19B
loop cannot function until this is fixed.** *Functionally the app is broken for real
users; security-wise the data is currently deny-all (safe but non-functional), and
the broad `anon` grants are a latent risk.*

### 🟠 Finding 2 — legacy `public.*` tables expose org-wide reads (empty, latent)
`public.{outcomes, icare_plans, resource_referrals, peer_circles, slogan_practices}`
each have `org_read_*` = `SELECT` to **any `authenticated` user** where
`org_id='gfa'` (no per-participant scope). They carry participant columns
(`participant_id`, `participant_quote`, …) but are **currently 0 rows**. The properly
scoped copies live in `gfa_icare` / `gfa_community` / `gfa_ui`
(`participant_id = my_*participant_id()` / staff / admin). So the `public.*`
duplicates are loose legacy tables — a cross-participant leak the moment they're
populated. Not breached today (empty), but must be closed before use.

### ✅ Confirmed healthy
- `participants` (16 rows): own-select (`supabase_user_id=auth.uid()`), coach-select
  (assigned / `my_assigned_participant_ids()`), coach-claim, admin — correctly scoped.
- `peer_coaches`: own + org-read + admin — scoped.
- Gate 19B columns and both guarded UPDATE policies applied correctly.

### Remediation — ✅ APPLIED & VERIFIED
Applied to `ykykeioydvtxpyreshhs` as migration `gate_19b_mvp_rls_remediation`
(mirrored in-repo at `supabase/migrations/20260720020000_gate_19b_mvp_rls_remediation.sql`
on `claude/vrcc-refine`; source also in `docs/rls-remediation-proposed.sql`). Scoped
SELECT/INSERT/UPDATE policies added to the five deny-all tables (participant-own +
assigned-coach + admin), `anon` grants revoked, and the five `org_read_*` policies
dropped.

**Verification (live, against real + simulated JWTs):**

| Test | Result |
|---|---|
| Policy inventory on 5 tables | SELECT/INSERT(/UPDATE)/admin present on each ✅ |
| `org_read_*` policies remaining | none ✅ |
| `anon` grants remaining | none ✅ |
| Stranger JWT (owns nothing) | sees **0** rows everywhere incl. `participants` (0/16), `outcomes`, `icare_plans` ✅ |
| Plain participant (`is_admin/is_coach=false`) | sees **only their own** participant row (1), and **can insert their own intake** — onboarding write un-blocked ✅ |
| Participant forging another email's intake | **blocked** by RLS (`42501`) ✅ |
| Admin account | sees all 16 (correct RBAC) ✅ |

**Finding 1 (the launch blocker) is resolved:** onboarding writes now succeed and are
scoped per participant. Remaining app-level loop tests (report §K.6) should be run via
a real signup in the app, but the DB layer that was blocking them is fixed.
