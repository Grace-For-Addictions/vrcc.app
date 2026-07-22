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

## Going live

1. `npm install`
2. Create `.env` with your project keys:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
3. Apply the schema: `supabase db push` (runs
   `supabase/migrations/20260722000000_v2_foundation.sql` — tables, views,
   triggers, RLS, and the Grace House seed).
4. Deploy the functions:
   ```
   supabase functions deploy create-meeting
   supabase functions deploy notify-fanout
   ```
   Optional secrets: `ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET`
   (otherwise a vendor-free meet link is used), `RESEND_API_KEY`,
   `TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER`, `APP_URL`,
   `NOTIFY_FROM_EMAIL`. Add a database webhook on INSERT into
   `v2_notifications` → `notify-fanout`.
5. Create a **private** Storage bucket named `voice-notes` (add owner-only
   storage policies: path prefix = the uploader's `auth.uid()`).
6. Enable Realtime on `v2_notifications`, `v2_session_requests`,
   `v2_housing_beds` (and `v2_housing_applications` for the staff board).
7. `npm run build` → deploy `dist/` anywhere static (Cloudflare, Netlify…).
   Serve `index.html` for unknown routes (SPA fallback).

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
