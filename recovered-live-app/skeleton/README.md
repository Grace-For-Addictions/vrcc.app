# GFA VRCC — reconstructed buildable skeleton

A **buildable** project skeleton reconstructed from the recovered production app
(`../`). The *plumbing is real*; the *screen UIs are stubs*. This exists so there is a
developable starting point in git — the original component source was not recoverable
(the production build ships no source maps).

## What is real vs. stub

| Real (faithful to production) | Stub (to be built) |
|---|---|
| Vite config: base `/vrcc/app/`, same vendor chunk split | Per-screen UI (one generic `Screen` for all 49) |
| Full 49-route table (`src/routes.js`) | Visual design / components |
| Supabase client → `ykykeioydvtxpyreshhs`, anon key via env | Forms, charts, 3D, maps wiring |
| Schema-scoped data layer (`src/lib/api.js`) matching the live schemas/RPCs | Auth flow / session gating |
| Nav shell grouped by the real route groups | |
| PWA manifest, base path, build output structure | |

Every stub screen displays the **exact backend tables and RPCs** the live app used for
it (sourced from `../analysis/data-model.md`), so replacing a stub with real UI is a
matter of building the view on top of an already-correct data binding.

## Run it

```bash
cp .env.example .env        # anon key is public by design
npm install
npm run dev                 # dev server
npm run build && npm run preview   # production build (verified: builds clean)
```

Without `VITE_SUPABASE_ANON_KEY` the app still renders; data calls are just offline
(the shell shows a notice).

## Layout

```
index.html            SPA entry (base /vrcc/app/)
vite.config.js        base + manualChunks mirroring the deployed bundles
postcss.config.js     empty (plain CSS, not Tailwind) — keeps the build self-contained
public/manifest.json  PWA manifest (recovered)
src/
  main.jsx            createRoot + BrowserRouter basename=/vrcc/app
  App.jsx             routes → Screen
  routes.js           all 49 routes with group + intended tables/RPCs
  lib/supabase.js     Supabase client (env-driven)
  lib/api.js          schema accessors (gfa_ui/core/engagement/…) + RPC wrappers
  components/Shell.jsx   grouped nav + offline notice
  components/Screen.jsx  generic reconstructed screen (documents data wiring)
  styles.css          plain CSS shell
```

## Honesty notes

- Dependency versions are inferred from the vendor chunks (React 18, Recharts, Framer
  Motion, three.js, supabase-js, Leaflet, react-markdown, date-fns) — not read from an
  original lockfile (none was recoverable).
- RPC argument names in `lib/api.js` are best-effort; confirm against the DB before use
  (flagged inline).
- `recharts` and `three` are declared but not yet imported by any screen, so they are
  tree-shaken out of the current build — present for when real screens use them.
