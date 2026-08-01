# Gate 0 — VRCC App Architecture Audit

**Date:** 2026-08-01
**Repo:** `grace-for-addictions/vrcc.app`
**Branch:** `claude/vrcc-app-setup-c959ah`
**Trigger:** Request to scaffold a new VRCC app (`npm create vite@latest gfa-vrcc --template react`).

> Governance basis: the GFA-VRCC Master Architect mandate requires inspecting the existing
> repository, Supabase schemas, migrations, production tables, RLS policies, functions,
> routes, services, and role architecture — and identifying the current source of truth —
> **before** creating new architecture. This document is that inspection. No application
> code, schema, or configuration was changed to produce it.

---

## 1. Headline finding

**The requested scaffold was not run.** Executing `npm create vite@latest gfa-vrcc` in this
workspace would have created a **fourth parallel codebase** alongside three that already
exist, which the mandate explicitly forbids:

> *"Do not create parallel architecture when functioning architecture already exists."*

Three further problems with the literal command sequence are recorded in §5.

---

## 2. Current state — repositories

| Repo | Stack | Size | Status |
|---|---|---|---|
| `vrcc.app` | React **18**, **JSX (no TypeScript)**, Vite 6, Tailwind **3**, React Router 6 | 277 source files, 60 pages | Two codebases in one repo (see below) |
| `RecoveryResidenceOS` | React **19**, **TypeScript**, Vite 6, Tailwind **4**, React Router 7 | ~35 source files | Matches the mandated stack |
| `GFA-ECO` | — | 2 config files + vendored agent skills | Effectively empty |

### 2.1 `vrcc.app` contains two apps, only one of which is mounted

- **Legacy Base44 app** — `src/pages/` (60 pages), `src/components/` (~35 dirs), routed by
  `src/App.jsx` via `src/pages.config.js`. Depends on `@base44/sdk` + `@base44/vite-plugin`.
  **It is not the mounted entry point.**
- **VRCC MVP** — `src/mvp/` (11 files: `MvpRoot`, `Landing`, `SignIn`, `Intake`, `Barc10`,
  `ParticipantApp`, `CoachApp`, `Messaging`, `SupportNow`, `lib.js`, `supabase.js`).
  `src/main.jsx` mounts `MvpRoot` — **this is what actually ships.**

So the repo carries ~270 files of unmounted legacy code around an 11-file live MVP. Any
"create the VRCC app" work must decide what happens to that legacy surface.

### 2.2 The repo is not what serves production

`CHANGELOG.md` states plainly that this repository is **not** the codebase live at
`vrcc.app`, and that the live build (WebGL/three.js, charts, motion, PWA, custom fonts) is
**not present in this repo**. What was deployed from here is the Cloudflare Worker
`virtualrecovery` → `virtualrecovery.thomas-499.workers.dev`.

**Consequence:** the immersive Des Moines VRCC environment described in the mandate may
already exist in a codebase not attached to this session. Building it here risks duplicating
it. This needs resolving before any immersive-world gate.

---

## 3. Database — source of truth is NOT verifiable from this session

This is the most consequential finding, and it blocks confident schema work.

**Application code points at project `ykykeioydvtxpyreshhs` (GRAVRCC_v6):**
- `vrcc.app` → `src/mvp/supabase.js`, `DEPLOY.md`
- `RecoveryResidenceOS` → `src/lib/supabase.ts`
- `GFA-ECO` → `.mcp.json` (`?project_ref=ykykeioydvtxpyreshhs`)

**The only project reachable via this session's Supabase credentials is
`evcbgzetxnbdfvthrjev`** (name: "vrcc.app", region `ca-central-1`, Postgres 17.6,
created 2026-07-22). It is **empty**:

| Probe | Result |
|---|---|
| `public` tables / views / matviews | **0** |
| `public` functions | **0** |
| `auth.users` | **0** |
| `gfa_core`, `gfa_engagement`, `gfa_slogans`, `grace_ai`, `gfa_residence` schemas | **0 of 5 present** |
| `supabase_migrations.schema_migrations` | table does not exist |

### 3.1 What this means

The canonical objects the mandate treats as authoritative could **not** be inspected or
confirmed to exist anywhere I can reach:

- `gfa_core.coaches` (canonical replacement for `support_personnel`)
- `grace_ai.outcome_tags`
- `compute_barc10_total()`
- the 59 canonical *Recovering the Mind* slogans
- `gfa_residence.*` (targeted by 8 applied `RecoveryResidenceOS` migrations)

Per the mandate — *"Do not assume the primary-key type until you inspect the related
production schema"* — I will not guess at these. **No migration should be authored until the
authoritative project is identified and readable.**

### 3.2 Migrations tracked in the repos (targets unverified)

- `vrcc.app/supabase/migrations/` — 2 files (Gate 19B continuity loop; MVP RLS remediation)
- `RecoveryResidenceOS/supabase/migrations/` — 8 files (policy engine, documents/signatures,
  residence ops, fn hardening, house board, PostgREST exposure, bed removal, public applications)

Both sets are documented as **already applied** to `ykykeioydvtxpyreshhs`.

---

## 4. Gap analysis vs. the mandate

| Mandated capability | Current state |
|---|---|
| React 19 + TypeScript | ❌ `vrcc.app` is React 18 + JSX. ✅ `RecoveryResidenceOS` only. |
| Experience 1 — Sanctuary | ⚠️ Partial: MVP participant home, intake, BARC-10, Support Now. No Recovery Pulse, Wellness Wheel, Wisdom Center, Grace AI, Recovery Circles. |
| Experience 2 — Command Center | ⚠️ Partial: MVP `CoachApp` attention queue + messaging. |
| Experience 3 — Executive Command Center | ❌ Not in the mounted app (legacy `ROIDashboard.jsx` is unmounted Base44 code). |
| Experience 4 — Recovery Residence Workspace | ✅ Strongest surface — `RecoveryResidenceOS`, separate repo. |
| Experience 5 — RCC Workspace | ❌ Not present. |
| Immersive VRCC / Des Moines world | ❌ Not in this repo. `three@0.171.0` is a dependency but unused by the mounted MVP. Possibly exists in the un-attached live build. |
| Cosmic Grace design tokens | ❌ `tailwind.config.js` is stock shadcn HSL vars. No `--void`, `--deep`, `--teal`, `--gold`; no Cinzel / Crimson Pro / Space Mono. |
| Grace Engine / slogans / ICARE | ❌ Not present. |
| Exhibit E / Narcan / volunteer hours | ❌ Only unmounted legacy `NarcanTracker.jsx`, `IBHRSReporting.jsx`. |

**Net:** roughly two of five mandated experiences exist in partial form, split across two
repos on two different major React versions.

---

## 5. Problems with the literal scaffold command

1. **Creates parallel architecture** — a 4th codebase; forbidden by the mandate (§1).
2. **Wrong stack** — `--template react` yields a **JavaScript** template. The mandate
   requires **TypeScript** (`--template react-ts`).
3. **Wrong React version by default in the target repo** — `vrcc.app` is pinned to React 18;
   the mandate specifies React 19.
4. **Malformed as written** — the request contains en-dashes (`– –template react`) rather
   than `--`. As typed it would have created a project literally named `–` and silently
   ignored the template flag.
5. **Redundant dependencies** — every package in the install list
   (`@supabase/supabase-js`, `react-router-dom@6`, `@tanstack/react-query`, `lucide-react`,
   `date-fns`, `clsx`, `tailwind-merge`, `tailwindcss`, `postcss`, `autoprefixer`,
   `typescript`, `@types/*`) is **already present** in `vrcc.app/package.json`. Only
   `zustand` and `@supabase/auth-ui-react` are genuinely absent.
   Note: `@supabase/auth-ui-react` is **deprecated/unmaintained** upstream — it should not be
   adopted for a new dignity-critical auth surface without review.
6. **`npx tailwindcss init -p` would overwrite** the existing `tailwind.config.js` and
   `postcss.config.js`, destroying the shadcn/ui token wiring that ~50 UI components depend on.

---

## 6. Risks

| Risk | Severity |
|---|---|
| Authoring migrations against an unverified schema; colliding with real production data | **High** |
| Duplicating the immersive VRCC build that already exists outside this session | **High** |
| Fragmenting the participant record across a 4th codebase | **High** |
| `tailwindcss init -p` clobbering the working design-token config | Medium |
| Splitting the ecosystem across React 18 (JSX) and React 19 (TS) indefinitely | Medium |
| Adopting deprecated `@supabase/auth-ui-react` | Low–Medium |

---

## 7. Explicit exclusions — what this gate did NOT change

- No files created, modified, or deleted outside this document.
- No dependencies installed; no `package.json` / lockfile changes.
- No Vite, Tailwind, PostCSS, or ESLint config touched.
- No migrations authored or applied; **no DDL executed against any Supabase project**.
- No RLS policies, functions, or grants altered.
- No routes added or removed; entry point unchanged.
- No deployment performed or triggered.

Read-only SQL against `evcbgzetxnbdfvthrjev` (catalog counts only) was the sole database
interaction.

---

## 8. Blocking decisions required before Gate 1

1. **Which Supabase project is authoritative** — `ykykeioydvtxpyreshhs` (what the code
   targets) or `evcbgzetxnbdfvthrjev` (what this session can reach, currently empty)?
   If the former, this session needs credentials for it. **This blocks all schema work.**
2. **Where the canonical VRCC app lives** — new app in `vrcc.app`, extend the existing MVP
   in place, or consolidate with `RecoveryResidenceOS`.
3. **What happens to the ~270 unmounted Base44 files** — retire, port, or leave dormant.
4. **Whether the live WebGL vrcc.app build should be attached to this session** before any
   immersive-world work begins.

---

## 9. Verification method for this gate

- Repo inventory: `find`/`ls` file counts, `package.json` reads, `git log`/`git branch`.
- Entry point traced: `src/main.jsx` → `src/mvp/MvpRoot.jsx` (confirms MVP is what ships).
- Database: live catalog queries against `pg_namespace`, `pg_class`, `pg_proc`, `auth.users`
  on `evcbgzetxnbdfvthrjev` via the Supabase MCP connection.
- Project reachability: `list_projects` returned exactly one project.

Every claim above is drawn from an observed command result. Nothing about the contents of
`ykykeioydvtxpyreshhs` is asserted — it was **not reachable** and is reported as unknown.
