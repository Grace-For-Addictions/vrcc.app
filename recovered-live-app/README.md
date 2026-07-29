# Recovered live app — `vrcc.app` (GFA VRCC)

**Recovered:** 2026-07-29, from the public production deployment.
**Source of record:** `https://gfa-vrcc.pages.dev/vrcc/app/` (= `https://vrcc.app/vrcc/app/`,
byte-identical build). Cloudflare **Pages** project `gfa-vrcc`.

## Why this exists

The code serving `vrcc.app` was **not present in any git branch** (see
`docs/branch-consolidation-audit.md`). This directory is a recovery of that production build,
captured directly from the deployed, publicly-served assets so the live app has a git
source-of-truth again.

## Honest scope — what "recovered" means here

The production build ships **without source maps** (stock Vite prod build; the bundles carry no
`//# sourceMappingURL`, and probing `.map` URLs returns Cloudflare's SPA fallback, not real maps).
So this is **not** a recovery of the original `.tsx` files with their names and comments — that
information was discarded at build time and cannot be reconstructed. What *is* recovered:

| Artifact | What it is | Fidelity |
|---|---|---|
| `dist/` | Byte-exact copy of every asset the site serves (HTML, JS, CSS, manifest) | **Perfect** — re-deployable as-is |
| `analysis/data-model.md` | Every Supabase schema, table, and RPC the app calls | **Exact** — extracted from the bundle |
| `analysis/routes.md` | All 49 in-app routes | **Exact** |
| `analysis/endpoints-and-deps.md` | External services + dependency set | **Exact / inferred** |
| `readable/index.app.beautified.js` | The app bundle run through Prettier | **Low** — logic preserved, names still minified; reference only |

## Redeploying this exact build (disaster-recovery)

`dist/` is a complete static site. If the live deployment is ever lost, it can be restored:

- **Cloudflare Pages:** create/point a project at `dist/` (Wrangler:
  `npx wrangler pages deploy dist --project-name gfa-vrcc`), or drag-drop `dist/` in the Pages UI.
- The app is mounted at base path `/vrcc/app/`; `dist/index.html` is the SPA entry. Configure
  SPA fallback (serve `index.html` for unknown paths).
- Backend needs no change: it points at Supabase `ykykeioydvtxpyreshhs` with the **public
  anon** key (embedded by design — no secret is present; verified: no `service_role`, no
  `sk_live`).

**This is a build backup, not a development source.** To make code changes you still need the
real project (the unpushed session that built it). This recovery guarantees the *running app*
survives; it does not replace getting that source into git.

## What the app is

One unified PWA — the flagship VRCC Center — combining the **ICARE** recovery path, the **Grace**
companion, community/coaching, an Iowa resource map, and light **Grace House** residence features.
Stack (from vendor chunks): React, Recharts, Framer Motion, three.js (WebGL), Radix-style UI,
`@supabase/supabase-js`. Backend: primarily the `gfa_ui` schema (see analysis).
