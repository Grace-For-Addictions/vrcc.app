# Gate 1 — Cosmic Grace design tokens + foundation dependencies

**Date:** 2026-08-02
**Repo:** `grace-for-addictions/vrcc.app`
**Branch:** `claude/vrcc-app-setup-c959ah`
**Predecessor:** [Gate 0 — VRCC App Architecture Audit](./gate-0-vrcc-app-architecture-audit.md)

---

## Scope

Establish the Cosmic Grace design-system foundation in the existing `vrcc.app`
repository, and add the one genuinely-missing dependency from the setup request.

This is the *safe subset* of "create the VRCC app": it delivers the foundation the
requested scaffold command was reaching for, **in place**, without creating a fourth
parallel codebase and without touching the database — which Gate 0 established is not
verifiable from this session.

## Files changed

| File | Change |
|---|---|
| `src/index.css` | **Added** a `@layer base :root` block defining `--cosmic-void/deep/teal/gold` and `--font-display/editorial/data`. Existing shadcn HSL variables untouched. |
| `tailwind.config.js` | **Added** `colors.cosmic.*` and `fontFamily.{display,editorial,data}` inside `theme.extend`. No existing key modified. |
| `package.json` | **Added** `zustand@^5.0.14`. |
| `package-lock.json` | Lockfile for the above (+ first full install of existing deps). |

## Database

**None.** No migration authored, no DDL executed, no RLS policy, function, grant, or
schema touched in any Supabase project. Per Gate 0 §3, the authoritative project
(`ykykeioydvtxpyreshhs`) is not reachable from this session, so schema work remains
blocked and deliberately out of scope.

## Authorization

**No change.** No roles, policies, grants, or auth surfaces were added or modified.

## Design decisions

- **Namespaced `cosmic-*`.** The mandate names the tokens `--teal` and `--gold`. Binding
  those directly to Tailwind's `teal`/`amber` keys would have **shadowed Tailwind's stock
  colour scales**, silently restyling existing components that use `teal-500` and friends.
  They are namespaced `cosmic-*` instead. Verified below that both palettes coexist.
- **Accent semantics** follow the mandate: `cosmic-teal` for participant surfaces
  (The Sanctuary), `cosmic-gold` for coach/professional/administrative surfaces
  (The Command Center).
- **`npx tailwindcss init -p` was NOT run.** It would have overwritten the existing
  `tailwind.config.js` and `postcss.config.js`, destroying the shadcn/ui token wiring that
  ~50 UI components depend on. The configs were edited in place instead.
- **Fonts are declared, not yet loaded.** Cinzel / Crimson Pro / Space Mono webfont files
  are not bundled. Each stack falls back to a system face so nothing breaks. They are
  deliberately **not** pulled from a third-party font CDN: this platform's privacy posture
  argues for self-hosting rather than disclosing participant page views to an external
  host. Self-hosting the files is a follow-up gate.
- **`@supabase/auth-ui-react` was NOT installed.** It is deprecated/unmaintained upstream.
  Adopting it for a dignity-critical auth surface warrants an explicit decision rather than
  a silent install. Flagged, not actioned.

## Risks

| Risk | Assessment |
|---|---|
| Shadowing Tailwind's stock colour scales | **Mitigated** — namespaced; verified `bg-teal-500` still generates. |
| Breaking shadcn/ui token wiring | **Mitigated** — additive only; verified `bg-background` still generates. |
| Config clobbered by `tailwindcss init -p` | **Avoided** — command not run. |
| `zustand` v5 peer conflict with React 18 | None observed; installs clean, build green. |

## Verification (performed, not assumed)

1. **Baseline first.** `npm run build` on unmodified `HEAD` → **exit 0**. Establishes the
   build was green *before* any edit, so a later failure would be attributable.
2. **Post-change build.** `rm -rf dist && npm run build` → **exit 0**.
3. **Tokens reach production CSS.** Grep of `dist/assets/*.css` confirms all four emitted:
   `--cosmic-void: #04030a`, `--cosmic-deep: #0a0818`, `--cosmic-teal: #1fb6b6`,
   `--cosmic-gold: #c8972a`, plus `--font-display/editorial/data`.
4. **Utility classes generate, and nothing is shadowed.** A throwaway probe (built in the
   scratch dir, not committed) compiled against this repo's real Tailwind config produced:
   `.bg-cosmic-void`, `.bg-cosmic-deep`, `.text-cosmic-teal`, `.border-cosmic-gold`,
   `.font-display`, `.font-editorial`, `.font-data` — **and** `.bg-teal-500` and
   `.bg-background`, confirming the stock and shadcn palettes still work.
5. **Lint.** `npx eslint tailwind.config.js` → **exit 0**.
6. **Diff scope.** `git status` shows exactly the four files listed above.

## Explicit exclusions — deliberately NOT changed

- Entry point untouched: `src/main.jsx` still mounts `src/mvp/MvpRoot.jsx`.
- No route added, removed, or rewired; `src/pages.config.js` untouched.
- The ~270 unmounted Base44 files under `src/pages` and `src/components` were not
  retired, ported, or modified — that decision is still open (Gate 0 §8).
- No component was restyled to use the new tokens. This gate *establishes* the palette;
  applying it to the Sanctuary and Command Center surfaces is a later gate.
- No React 19 / TypeScript migration. The repo remains React 18 + JSX; that migration is a
  distinct, larger gate.
- No immersive VRCC / Three.js work — Gate 0 §2.2 flags a real risk of duplicating a live
  build not attached to this session.
- No Supabase, Cloudflare, or deployment change. **Nothing was deployed.**

## Still blocking Gate 2

Unchanged from Gate 0 §8 — the decisions that need an answer before schema or product work:

1. Which Supabase project is authoritative (`ykykeioydvtxpyreshhs` vs the empty
   `evcbgzetxnbdfvthrjev`), and credentials for it. **Blocks all schema work.**
2. Where the canonical VRCC app lives — extend the MVP here, or consolidate with the
   React 19 + TypeScript `RecoveryResidenceOS`.
3. Fate of the ~270 unmounted Base44 files.
4. Whether the live WebGL `vrcc.app` build should be attached before immersive work.
