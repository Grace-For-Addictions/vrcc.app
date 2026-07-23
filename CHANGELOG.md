# CHANGELOG — `grace-for-addictions/vrcc.app`

> **Important scope note.** This repository is **not** the codebase currently live at
> **vrcc.app**. The live vrcc.app app is a separate, more advanced build (WebGL/three.js,
> charts, motion, PWA, custom font stack) that is **not present in this repo** and was
> **not deployed from here**. This repository contains: the original **base44** VRCC app,
> the participant/coach **MVP** (`src/mvp/`), and the **Grace House** recovery-residence
> build-out (`gracehouse/`, `supabase/migrations/`). See "Deployment" below.

## Repository contents

- **`src/`** — the original **base44** VRCC app (pages, components, `App.jsx`). Present but
  **not the mounted entry** on `main`: `src/main.jsx` mounts the MVP (`MvpRoot`).
- **`src/mvp/`** — the **VRCC MVP** (participant + coach): Supabase-auth onboarding
  (intake → BARC-10 → home with a "Your next step" card), coach dashboard with a
  "Needs attention" queue, 1:1 messaging, Support Now crisis path. Backed by Supabase
  project `ykykeioydvtxpyreshhs` (`public` schema: `participants`, `mvp_*`).
- **`gracehouse/`** — the **Grace House** recovery-residence app (React 19 + TypeScript +
  Vite + Tailwind + React Router), on the `claude/gracehouse-buildout` branch. Renders
  from a canonical policy engine; resident onboarding wizard with e-signature.
- **`supabase/migrations/`** — applied, additive migrations: Gate 19B continuity loop +
  RLS remediation (VRCC), and the Grace House foundation (policy engine, document/
  signature integrity, residence roles) in the `gfa_residence` schema.
- **`docs/`** — the launch-schema-wiring audit, the Gate 19A launch-readiness report, and
  the Grace House build-out plan / Decision Register.

## Session changelog (2026-07)

### VRCC MVP
- Built the participant + coach MVP on Supabase (`mvp_*`, `public.participants`).
- **Gate 19B** continuity loop: `next_step` / `follow_up_due` on sessions, participant
  next-step card, coach attention queue, Support Now. Migration applied + verified.
- **RLS remediation**: closed a deny-all gap that blocked onboarding writes; scoped
  participant-own / assigned-coach / admin policies; revoked stray `anon` grants; closed
  an org-wide read exposure on legacy `public.*` tables. Verified with live RLS tests.
- Deployed the MVP as the Cloudflare Worker **`virtualrecovery`** (see Deployment).

### Grace House build-out
- Verified the live `gfa_residence` schema and reused it (no parallel subsystem).
- Added (applied to prod, additive): **policy engine** (`policy`/`policy_version` + curfew
  midnight-ceiling validator, seeded GH-CURFEW-001 v2.0 / GH-FEES-001 / GH-CONTACT-001 /
  GH-LANG-001), **document + signature integrity** (immutable snapshots, write-once
  signatures), **residence-scoped 8-role model**, and the **Grace House residence config**
  (1311 9th Street; women-focused; fees $175/$200; status "preparing", never "certified").
- Scaffolded the Grace House app in the mandated stack; built the resident onboarding flow.

## Security

- No secrets committed. The only key present is the Supabase **publishable (anon)** key in
  `src/mvp/supabase.js` — public by design; access is governed by Row-Level Security.
  No `service_role` keys, API tokens, or `.env` files are tracked.

## Deployment (what is actually known)

- **What was deployed from this repo:** the Cloudflare **Worker `virtualrecovery`**
  (Cloudflare account tied to Thomas@graceforaddictions.org, account id
  `499272c2f0336cc60207bad24edd0e14`), via **Workers Builds** connected to this GitHub
  repo, branch `main` — build `npm run build`, deploy `npx wrangler deploy`, serving
  `./dist` as static assets (`wrangler.jsonc`, SPA fallback). URL:
  `virtualrecovery.thomas-499.workers.dev`.
- **vrcc.app** is served by Cloudflare but returns a *different, richer* app than the
  `virtualrecovery` worker, and the account has only that one Worker — so vrcc.app is a
  **separate deployment (most likely a Cloudflare Pages project) of a different codebase**,
  not created from this repo and not enumerable with the tools available here. To identify
  it: Cloudflare dashboard → Workers & Pages (look for a Pages project) and the vrcc.app
  zone's custom-domain / DNS binding.
