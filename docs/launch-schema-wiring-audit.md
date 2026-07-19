# Launch Schema Wiring Audit

**Scope:** Resolve the six wiring questions for the launch continuity loop
(session close → next action → participant home → coach attention → overdue return)
against the *actual* repository, and correct the assumed live-schema model.

**Method:** Traced every read/write of the coaching-session entities, the
goal/next-action entities, and the follow-up fields across `src/`. All claims
below cite `file:line`.

---

## TL;DR — the assumed schema does not match the repo

The planning note assumed `gfa_engagement.sessions.follow_up_due` and
`gfa_ui.goals.small_step` exist as live fields. **Neither exists in this
codebase.** The real model is more fragmented, and the loop is blocked by
*wiring* defects, not missing schema:

1. There is **no follow-up field on any coaching-session entity.** The only
   `follow_up_*` fields live on **referrals and communication logs**, where they
   are already both read *and* written. So "read but never written" does not
   describe this repo — the follow-up concept is simply **not wired into the
   session lifecycle at all.**
2. There are **two split-brain session entities** (`CoachingSession` vs
   `CoachingSessionLog`); one is canonical, one is a legacy read path feeding
   empty data to five AI features.
3. There are **four unrelated representations of a "goal / next action,"** none
   named `small_step`, and the participant-facing one is broken by a **three-way
   `status` vocabulary mismatch** plus a render-crashing missing import.

**Recommendation stands and strengthens:** prefer wiring over new schema — but
the minimum real work is (a) unifying goal `status`, (b) fixing the participant
goal surface, and (c) deciding *where* a session-set `follow_up_due` should live
(it has to be added to `CoachingSessionLog`; it cannot simply be "reused").

---

## Entity map (the real constructs)

### Session records — two entities, one canonical

| Entity | Role | Key fields | Written by | Read by |
|---|---|---|---|---|
| **`CoachingSessionLog`** | **CANONICAL live session record** | `activity_date`, `client_email`, `contact_email`, `coach_name`, `activity_notes`, `personal_goal`, `goal_set`, `personal_affirmation`, `referral_*`, `ai_generated_summary` | `SessionEntryForm` (`src/components/coaching/SessionEntryForm.jsx:43`), `UniversalActivityForm`, `MobileOutreachTracker`, `AIResourceNavigator`, `BeepurpleSync` | 15+ readers: `ParticipantDashboard`, all `govdash/*`, analytics, reporting |
| **`CoachingSession`** | **LEGACY / split-brain** | `scenario_id`, `empathy_score`, `mi_skills_score`, `resource_accuracy` (VR training scores) | **Only** `PeerCoachTraining.jsx:376` (VR training simulator) | 5 AI features: `RecoveryCapitalOptimizer`, `PersonalizedContentEngine`, `AIRecoveryJourney`, `ProactiveNudges`, `ProactiveOutreach` |

The `CoachingSession` readers filter on `client_email` / `created_by` and sort by
`session_date` (e.g. `PersonalizedContentEngine.jsx:34`,
`ProactiveOutreach.jsx:37`) — **none of which the only writer sets.** The training
writer stores scenario scores with no `client_email` and no `session_date`
(`PeerCoachTraining.jsx:376-386`). Result: those five AI personalization features
read **empty or wrong-shaped data** and silently degrade.

### Goal / "next action" — four representations, none called `small_step`

| Representation | Where it lives | Written by | Read by | On the *home* surface? |
|---|---|---|---|---|
| **`MenteeGoal`** (`goal_title`, `goal_description`, `goal_type`, `target_date`, `status`, `progress_percentage`) | coach-assigned goal | `CoachDashboard.jsx:99` (create) | `ParticipantDashboard.jsx:43`, `CoachDashboard.jsx:91`, `BeePurpleReporting.jsx:48` | Only on `ParticipantDashboard` (a secondary route) |
| **`UserProfile.current_goal`** (single free-text string) | profile field | `Home.jsx:423` (`auth.updateMe`) via `GoalSettingAssistant` | AI nudges/analyzers (`GoalProgressNudges.jsx:14`, `SessionAnalyzer.jsx:43`) | **Yes — on the real home (`Home.jsx`)** |
| **`GFAPlan`** (5-section GRACE plan) | structured plan | `MyGFAPlan.jsx:171`, `MyGrowthGarden.jsx:42` | `GFAPlanCard.jsx:18`, `Home.jsx` | **Yes — primary card on `Home.jsx`** |
| **`ResidentGoal`** | sober-living residency subsystem | `ResidentGoals.jsx:31` | `ResidentGoals`, `RecoveryPlanAI` | No (residency portal only) |

`next_step` / `next_steps` appear only as **ephemeral AI output that is never
persisted** — `BudgetingVRModule.jsx:140`, `PersonalizedRecommendations.jsx:102`,
`ParticipantJourneyMap.jsx:192`. There is no durable `small_step` field anywhere.

---

## Answers to the six audit questions

### 1. Which implementation does the production frontend *read*?
- **Sessions:** primarily **`CoachingSessionLog`** (15+ readers, including the
  participant surface). `CoachingSession` is read only by 5 AI features, on
  fields its writer never populates.
- **Goals on the real home (`Home.jsx`, `mainPage: "Home"` in
  `pages.config.js:177`):** reads **`GFAPlan`** (`GFAPlanCard`) and
  **`UserProfile.current_goal`** (`GoalSettingAssistant`). It does **not** read
  `MenteeGoal`.
- **`MenteeGoal`** is read only by `ParticipantDashboard` — a registered but
  **secondary** route (`/ParticipantDashboard`), not the landing page.

### 2. Which implementation does it *write*?
- **Sessions:** **`CoachingSessionLog`** is the sole real write target at session
  close (`SessionEntryForm.jsx:43`). `CoachingSession` is written only by the VR
  training simulator.
- **Goals:** `CoachDashboard` writes `MenteeGoal`; `Home` writes
  `UserProfile.current_goal`; `MyGFAPlan` writes `GFAPlan`. Three separate write
  paths that never converge.

### 3. Which are dead / legacy?
- **`CoachingSession` is legacy/orphaned** as a *coaching* record: its only writer
  is the training simulator, yet 5 AI features read it as if it held real session
  history. Effectively a dead read path.
- **`ParticipantDashboard`'s "Next Session" card is dead** — it reads
  `session_date` / `coach_email` (`ParticipantDashboard.jsx:75, 255-258`) from
  `CoachingSessionLog`, which stores `activity_date` / `coach_name` and only *past*
  activity. It can never resolve a future session.
- `ResidentGoal` is not dead but is a **separate subsystem** (residency), not part
  of the participant→coach loop.

### 4. Why is `follow_up_due` read but never written?
**It isn't — the premise doesn't hold in this repo.** There is no `follow_up_due`
(or any follow-up field) on either session entity. The follow-up fields that exist
—`follow_up_needed`, `follow_up_date`, `follow_up_notes`, `follow_up_completed`—
live on **`CommunicationLog`** and **`Referral` / `ClosedLoopReferral`**, and on
those entities they are **both written and read**:
- `CommunicationLogger.jsx:23-24, 145` (write) and `179-193` (read)
- `IntakeCoordinatorDashboard.jsx:101-103` (write) / `:80` (read)
- `ServiceCoordinationHub.jsx:357` (write) / `:186` (read)
- `ClosedLoopCoordination.jsx:75` (write) / `:230` (read)

So the follow-up infrastructure is fully wired — just in the **referral/comms**
subsystem, not the coaching session. The coach "attention queue" on
`CoachDashboard` ("Needs Attention", `CoachDashboard.jsx:223`) is driven by
**`ProgressInsight.severity`** (`:189-191`), **not** by any follow-up date.

### 5. Can session close safely write `follow_up_due`?
**Only by adding a field — it cannot be "reused."** `SessionEntryForm` already
`create`s a `CoachingSessionLog` with arbitrary fields (`:43`, `:222`), so writing
a new `follow_up_due` there is low-risk and requires no migration on a schemaless
base44 entity. But there is **no existing session-level follow-up field to reuse**;
the referral/comms `follow_up_date` belongs to different entities and workflows.
The honest conclusion: this is a **small, additive** change to `CoachingSessionLog`,
not pure reuse.

### 6. Can participant home safely surface `small_step` as the primary next action?
**Not as-is — three blockers, and a "which home / which goal" decision.**

- **There is no `small_step` field.** The nearest durable construct is
  `MenteeGoal` (`goal_description` + `target_date` + `status`).
- **The real home (`Home.jsx`) does not read `MenteeGoal` at all** — it surfaces
  `GFAPlan` and `UserProfile.current_goal`. The page that *does* surface
  `MenteeGoal` (`ParticipantDashboard`) is a secondary route. Surfacing a
  coach-set goal on the actual landing page is **new wiring**, not a toggle.
- **`MenteeGoal` is broken by a three-way `status` vocabulary mismatch** (see
  below), so even where it is surfaced, coach-assigned goals don't show.

---

## Concrete wiring defects blocking the loop

### A. Goal `status` vocabulary is inconsistent (highest priority)
- Create path sets **no status**: `CoachDashboard.jsx:492-496` mutates
  `{ ...newGoal, mentee_email, coach_email }` — `newGoal` has no `status`.
- Participant reads `status === 'in_progress'` / `'achieved'`
  (`ParticipantDashboard.jsx:65-66`).
- Coach + reporting read `status === 'active'` / `'completed'`
  (`CoachDashboard.jsx:516-517`, `BeePurpleReporting.jsx:75-76`).

**Effect:** a coach-assigned `MenteeGoal` has `status === undefined`, so it is
**invisible** in the participant's "Active Goals" and renders as an unknown/gray
badge on the coach side. The core "coach sets goal → participant sees it" hop is
broken today. Fix by standardizing one vocabulary and defaulting `status` on create.

### B. `ParticipantDashboard` crashes on the goals card — missing import
`<Plus>` is used at `ParticipantDashboard.jsx:183` but is **not imported**
(imports at `:10-13` omit it). The "Active Goals" section always renders, so this
is a `ReferenceError: Plus is not defined` at render. The participant goal surface
is effectively non-functional until this is fixed.

### C. "Next Session" card reads the wrong fields (dead)
`ParticipantDashboard.jsx:75` selects a future session by `session_date`, and
`:255-258` renders `coach_email`. `CoachingSessionLog` uses `activity_date` and
`coach_name` and records only past activity. The card never appears.

### D. `CoachingSession` split-brain starves 5 AI features
See Entity map. Either repoint those readers at `CoachingSessionLog` (with field
renames `activity_date`/`coach_name`) or retire the legacy entity.

---

## Recommended sequencing (implementation gate, not planning)

The loop the plan wants —
`session close → next action → participant home → attention queue → overdue return`
— maps onto existing infrastructure with **mostly wiring fixes plus one additive
field**:

1. **Unify goal `status`** (defect A). Pick `active`/`completed` (already used by
   two of three readers) and default it on create. *Wiring only.*
2. **Fix the participant goal surface** (defects B, C) and decide whether the
   canonical participant next-action is `MenteeGoal`, `UserProfile.current_goal`,
   or `GFAPlan`. Recommend consolidating on `MenteeGoal` and surfacing it on
   `Home.jsx` (the real landing page). *Wiring + one product decision.*
3. **Add `follow_up_due` to `CoachingSessionLog`** and write it from
   `SessionEntryForm` at session close (question 5). *One additive field.*
4. **Point the coach attention queue at `follow_up_due`** alongside the existing
   `ProgressInsight.severity` signal (question 4 / defect). *Wiring only.*
5. **Retire or repoint `CoachingSession`** (defect D). *Cleanup.*

No new conceptual architecture is required. The single genuinely new piece of
schema is a session-level `follow_up_due`; everything else is reconciling
vocabularies and repointing reads at the entity that already holds the data.
