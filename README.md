# GFA VRCC.app — Virtual Recovery Community Center

**Connection Prevents Crisis · No Fees. No Stigma. Just Grace.** 🌱

**v3 "Quantum Bridge" edition** — this codebase is the new foundation for the app running at
`virtualrecovery.thomas-499.workers.dev`, fully wired to the LIVE **Grace For Addictions** Supabase
project (`ykykeioydvtxpyreshhs`). It keeps every participant, intake, and assessment already in
production and extends the running MVP rather than replacing its data.

## How the merge works
- **Same backend, extended additively.** Two migrations (`vrcc_quantum_bridge_v3`, `v3_1`) are already
  applied to production: new columns on `mvp_session_requests`, `mvp_sessions`, `daily_pulse`,
  `daily_cultivations`, `directory_entries`; new tables `session_feedback`, `housing_applications`,
  `residence_beds`; views `v_mycelium_trends`, `v_housing_availability`; consent-safe notification
  triggers writing to your existing `notifications` table. Nothing was dropped or renamed.
- **Matched-coach model preserved.** Like the live MVP, participants request sessions with their
  assigned coach (`participants.assigned_coach_email`); coaches accept a proposed time, suggest
  alternates with a note, or pass — the participant is notified either way.
- **Morning Intentions → `daily_pulse`**, **Evening GROW/BARC-pulse/declaration → `daily_cultivations`**,
  offline-queued in IndexedDB and synced idempotently via `client_uuid`.
- **Resource Hub → your production `resources` table** (county + statewide, `serves_rural`,
  `is_virtual` telehealth filter, MAT-friendly/justice-involved/peer-led badges).
- **Housing → `directory_entries`** (rules/expectations jsonb now live on entries) +
  `housing_applications` wizard + real-time `residence_beds` board.
- **Crisis strip on every page** → `crisis_resources` table with a hardcoded 988/YourLifeIowa fallback.
- **Auth** → existing Supabase email auth + `get_my_role()` RPC ('participant' | 'coach' | 'admin').

## Deploy (replaces the current bundle on the same Worker)
```bash
npm install
npm run build
npx wrangler deploy        # wrangler.jsonc targets the existing `virtualrecovery` worker
```

## Already done in production (2026-07-23)
- ✅ **Grace House seeded** in `directory_entries` from the canonical Build-Out register (GH-FEES-001,
  GH-RECOVERY-001 v1.1, GH-ACTIVITY-001 v1.1, GH-CURFEW-001 v2.0): 10 house rules + 5 expectations,
  person-first language, "preparing for NARR Level II" framing, deposit terms marked pending (GH-D004).
- ✅ **8 placeholder beds** in `residence_beds`, all seeded `offline` per GH-D003 (capacity unverified):
  the app shows no availability claims until the House Manager verifies each bed and flips it on
  from the Ops bed board.
- ✅ **`voice-notes` storage bucket** with owner-scoped upload/read/delete policies.
- ✅ **Realtime** enabled on `mvp_session_requests`, `mvp_sessions`, `residence_beds`, `notifications`.
- ✅ **`create-meeting` Edge Function deployed** (v2, ACTIVE) — see Meetings below.

## Meetings: Ooma Office
GFA uses **Ooma Office**. Ooma Meetings rooms are reusable personal rooms, so each coach registers
their room link once (Coach dashboard → **My meeting room**, stored in `coach_meeting_rooms`), and that
single link powers **1:1 coaching, group coaching, recovery meetings, workshops, trainings, resource
navigation, and needs-assessment visits**. When a coach accepts a session, participants automatically
receive the coach's Ooma room link. Zoom remains available as a secondary provider if you add
`ZOOM_ACCOUNT_ID` / `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` secrets to the Edge Function.

## Remaining setup
1. **Deploy the app**: `npm install && npm run build && npx wrangler deploy` (targets the existing
   `virtualrecovery` worker — the URL does not change).
2. **Coach accounts**: a coach's sign-in email must match `participants.assigned_coach_email` values;
   each coach pastes their Ooma room link on first visit to the Coach dashboard.
3. **Verify beds**: in Ops → bed board, tap each placeholder bed to bring it online once the real
   room/bed configuration is confirmed (GH-D003).

---

## Feature detail (v2 "Quantum Extension" heritage)

### 1 · Peer/Coach Session System
- Participants request `peer_support` / `recovery_coach` / `life_coach` sessions with preferred times, an optional topic (typed **or spoken**), and a Ooma Office/Zoom preference.
- Coaches see a shared pool of open requests **for their session types only** and their own confirmed sessions. They can **accept** a proposed time (auto-creates the video link), **suggest alternates** with a note, or **pass** — passing routes the request straight back to the pool with zero penalty. Only what works for them.
- Accepted sessions get a Ooma Office/Zoom link (created server-side by the `create-meeting` Edge Function) and a one-tap **Add to calendar** link.
- Post-session: both sides can leave a rating, "did you feel heard?", reflections, and follow-up suggestions.
- Notifications fire automatically via DB triggers (in-app always; email/SMS **only with explicit consent**, via the `notify-fanout` Edge Function).

### 2 · Daily Recovery Practices
- **Morning Intentions** — type or speak an intention, or record a full voice note; rotating BDNF movement prompt with a one-tap commitment.
- **Evening Reflections** — guided GROW (Goal · Reality · Options · Will), a 1–6 quick BARC pulse, one gratitude, and a nightly **declaration**.
- **Private by default.** Coach visibility is a per-check-in checkbox, re-decided every day. RLS enforces that a coach can only ever read shared check-ins from participants they hold an accepted/completed session with.
- **Mycelium Trend Map** — the last 30 days rendered as a living network: node size = BARC pulse, glow = movement, gold ring = declaration. Neuroplastic progress, visible.
- **Offline-first**: check-ins write to IndexedDB instantly and sync automatically when connectivity returns (idempotent via `client_uuid`). A gentle badge tells rural users their words are safe.

### 3 · Resource Navigation & Recovery Housing (Iowa)
- Searchable **Resource Hub** with category chips, **county filter** (local + statewide results), and a **telehealth-only** rural-priority toggle.
- **Grace House** (and future Iowa programs): rules & expectations readable **before** applying, live **bed availability**, and a 6-step **Application Wizard** — Rules → About You → Recovery Journey (voice-enabled, every pathway honored) → **Your Why** → granular Consent → Review.
- Drafts auto-save at every step; a dropped rural connection never loses a story.
- Submission auto-notifies the house manager (in-app + email) and all navigators, and warmly confirms receipt to the applicant.
- Staff schedule **virtual intakes** (Ooma Office/Zoom link auto-created) and manage a **real-time bed board** (available → hold → occupied) that updates every participant's view instantly via Supabase Realtime.

---

## Architecture

```
src/
  lib/            supabaseClient · offlineQueue (IndexedDB) · quantumMotion · meetings · voice
  stores/         useAuthStore · useSessionStore · useCheckinStore · useHousingStore · useNotificationStore  (Zustand)
  components/
    sessions/     SessionRequestForm · CoachRequestQueue · MySessionsList · SessionFeedbackForm
    checkins/     MorningIntention · EveningReflection
    housing/      HousingApplicationWizard · ResourceHub · ProgramCard · BedManagementBoard · ApplicationReviewList
    quantum/      MyceliumTrendMap
    shared/       VoiceTextField · NotificationBell · OfflineBadge · RoleGuard
  pages/          DailyPractice · Sessions · CoachDashboard · Housing · ProgramDetail · Apply · AdminHousing
supabase/
  migrations/0002_vrcc_quantum_extension.sql   (enums, tables, views, triggers, RLS, Grace House seed)
  functions/create-meeting                      (Ooma Office/Zoom, server-side credentials)
  functions/notify-fanout                       (consent-gated email/SMS via Resend/Twilio)
public/sw.js + manifest.webmanifest             (offline-first PWA)
```

**Roles & access (RLS-enforced):** `participant` · `coach` · `navigator` · `admin`. Coaches see only the request pool for their declared `coach_types`. House managers see only their program's beds and applications. Check-ins are readable by their author alone unless that specific check-in was consent-shared.

## Setup

```bash
npm install
cp .env.example .env          # add your Supabase URL + anon key
supabase db push              # applies 0002_vrcc_quantum_extension.sql (seeds Grace House + 8 beds)
supabase functions deploy create-meeting notify-fanout
# Secrets: ZOOM_ACCOUNT_ID ZOOM_CLIENT_ID ZOOM_CLIENT_SECRET UMA_API_KEY RESEND_API_KEY TWILIO_SID TWILIO_TOKEN TWILIO_FROM
# Storage: create a bucket named `voice-notes`
# Realtime: enable replication on session_requests, housing_beds, notifications
# Webhooks: notifications INSERT → notify-fanout
npm run dev
```

## Accessibility & rural commitments
- Voice-first input on every long-form field (Web Speech API with clean text fallback) + full voice-note recording for morning intentions.
- 17px base font, ≥48px touch targets everywhere, visible 3px focus rings, dark high-contrast forest palette.
- All Framer Motion animation flows through `useQuantumMotion()`, which returns static variants under `prefers-reduced-motion`; a global CSS clamp backs it up.
- Offline-first PWA: app shell cached, check-ins queued locally, automatic idempotent sync.

## Design language
Forest-floor darks (`moss`), bioluminescent accents (`spore`, `lichen`, `amber`), Fraunces display + Newsreader body. Motion vocabulary: **ripple** (arrival), **collapse** (commitment — the observed state resolves), **myceliumGrow** (threads of progress).

---

*Struggle is never punished here — silence is what we try to avoid.*
