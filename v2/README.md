# VRCC v2

Offline-first PWA for the Virginia Recovery Connection Center: peer-coaching
sessions, daily recovery practice, and recovery housing — built for rural
Virginia (spotty connections, phones-first, 48px+ touch targets).

## What's here

| Area | Features |
| --- | --- |
| **Sessions** | Request form (video/phone/in-person), coach queue with accept / suggest-times / pass-back-to-pool, auto meeting link via the `create-meeting` Edge Function, Google Calendar links, post-session feedback with follow-up asks |
| **Daily practice** | Morning Intentions with voice notes + daily BDNF ("brain-growth") prompts, Evening GROW reflection + 1-question BARC pulse + spoken declaration, per-day consent toggle for coach sharing, SVG mycelium growth map (node size = pulse, glow = movement, gold ring = declaration) |
| **Housing** | Resource Hub with county + telehealth filters, rules-before-apply gate, 6-step application wizard with auto-saving drafts and voice input, virtual intake scheduling, realtime bed board (Grace House seeded with 8 beds) |
| **Infrastructure** | Offline-first PWA (service worker app shell + idempotent IndexedDB sync queue keyed by `client_ref`), `useQuantumMotion()` honoring `prefers-reduced-motion`, notification triggers in Postgres with consent-gated email/SMS fan-out |

## Stack

React 18 + Vite + Tailwind, Supabase (Postgres + RLS + Realtime + Storage +
Edge Functions). No other runtime dependencies beyond `lucide-react`.

## Backend status: LIVE

The backend is deployed to the **Grace For Addictions** Supabase project
(`ykykeioydvtxpyreshhs`) and verified end-to-end in a real browser:

- ✅ Migrations applied: `v2_foundation`, `v2_go_live`, `v2_advisor_hardening`
  (tables, views, triggers, RLS, Grace House seed, signup-profile trigger,
  Realtime publication, private `voice-notes` bucket with owner-only policies)
- ✅ Edge Functions deployed: `create-meeting`, `notify-fanout`
- ✅ Security advisors clean for all v2 objects

Demo accounts (password `VrccDemo!2026`): `demo-participant@vrcc-v2.test`,
`demo-coach@vrcc-v2.test`, `demo-manager@vrcc-v2.test`,
`demo-navigator@vrcc-v2.test`.

## Running the frontend

1. `npm install`
2. `cp .env.example .env` (already pointed at the live project; the
   publishable key is safe client-side — RLS enforces access)
3. `npm run dev` — or `npm run build` and host `dist/` anywhere static
   (serve `index.html` for unknown routes).

## Optional integrations (not yet configured)

- **Zoom**: set `ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET` as
  function secrets; until then `create-meeting` issues a vendor-free
  meet.jit.si room per session.
- **Email/SMS fan-out**: set `RESEND_API_KEY` and/or
  `TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER` (plus `APP_URL`,
  `NOTIFY_FROM_EMAIL`), then add a database webhook on INSERT into
  `v2_notifications` → `notify-fanout`. In-app notifications already work
  without any of this, and external sends are consent-gated per user
  (`notify_email` / `notify_sms` metadata flags).

## Privacy model

- Daily check-ins are **private by default**. A coach sees a day's entry only
  if the participant flipped that day's share toggle **and** the participant
  is on that coach's caseload (`v2_profiles.coach_id`).
- External email/SMS notifications only fire for users whose
  `notify_email` / `notify_sms` metadata flags are explicitly true; in-app
  notifications always work.
- `anon` has no access to any v2 table.

## Roles

`v2_profiles.role`: `participant` (default on signup), `coach`,
`housing_manager`, `navigator`, `admin`. Assign staff roles and
`coach_id` caseloads via SQL or the Supabase dashboard.
