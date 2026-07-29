# Residence Application Flow — Integration Contract

**Date:** 2026-07-28 · **Status:** flow defined by owner; seams verified against
deployed bundles. One shared Supabase project (`ykykeioydvtxpyreshhs`) connects
every hop, which makes this integration data-plumbing, not API-building.

## The flow (owner-specified)

```text
vrcc.app (VRCC Center — flagship)
  └─ "Residences" nav ──▶ Residences directory (residences/index.html, this repo)
        └─ Grace House card ──▶ https://gracehouse4.pages.dev/
              └─ read documents/rules → application/intake  → writes `intakes` (verified in bundle)
                    └─ on submit ──▶ resident account created in
                        https://recovery-residence-os.thomas-499.workers.dev/
                        (future domain: recoveryresidence.app)
                        scoped to the residence applied for
                          └─ staff workflow: accept → waitlist  OR  place in bed
                                └─ resident prompted: "Check out the VRCC"
                                      └─ vrcc.app onboarding
```

## Verified deployment facts (2026-07-28)

| App | URL | Data layer (from deployed bundle) |
|---|---|---|
| Grace House applicant app | gracehouse4.pages.dev (Cloudflare Pages) | main Supabase; writes **`intakes`** |
| Recovery Residence OS | recovery-residence-os.thomas-499.workers.dev (Worker, **account `thomas-499`** — not the account connected to this session) | main Supabase; **`gfa_residence` canon**: `residences`, `beds`, `waitlist`, `pass_requests`, `grievances`, `fee_ledger`, `check_in_records`, `checkin_followups`, `announcements`, `providers`, `policy_versions`, `gh_signature_status` |
| VRCC Center (flagship) | vrcc.app | `gfa_ui` generation (source still unrecovered — see 02 §0) |
| Residences directory | `residences/index.html` (this repo; interim artifact URL until hosted) | static |

**Registry deltas:** two previously unknown deployments; a second Cloudflare
account (`thomas-499`); planned domain `recoveryresidence.app`. The deployed
Residence OS supersedes `residence/index.html` as the operational workspace —
the shell remains the white-label onboarding blueprint (03 doc).

## UPDATE 2026-07-28 — the flagship already carries both surfaces

Bundle inspection of vrcc.app shows the flagship ALREADY contains:
- a **public residences directory** reading `gfa_residence.residences`
  (`active AND public_listed`, filters: women/men/MAT/reentry) + `public_profiles`
  + `residence_availability` — this is what renders at vrcc.app/residences and it
  lists Grace House and Ernest & Johnnie White Recovery House from live data;
- a **staff house-management area** reading `beds`, `waitlist`, `drug_tests`,
  `iowa_hhs_checklist` per residence — so coaches/admin house management already
  exists inside vrcc.app, as the owner directs.

The ONLY missing link was an apply URL. Migration
`20260728000000_residence_apply_url.sql` (applied to prod, committed here) adds
`gfa_residence.public_profiles.apply_url` and sets Grace House →
https://gracehouse4.pages.dev/. Null apply_url = fall back to phone/contact.

`residences/index.html` in this repo is hereby a **fallback/reference page**, not
the canonical directory — the flagship's own DB-driven page is canonical.

## Who implements what

1. **Flagship session (vrcc.app) — one small code change:** on the residences
   page, when `public_profiles.apply_url` is set, render the card/detail CTA as
   **"Read the rules & apply →"** linking to `apply_url` (new tab); keep the
   phone fallback when null. Everything else it needs is already in its data.
2. **This repo (done):** `apply_url` migration + seed; `residences/index.html`
   kept as fallback/reference.
3. **gracehouse4 session:** on application submit — (a) keep writing `intakes`;
   (b) create the auth user (Supabase signup or invite) so the applicant has an
   account; (c) show "what happens next" + link to the Residence OS. The `intakes`
   row must carry `residence_id` (Grace House) so the account lands under the
   right residence.
4. **Residence OS session:** an **Applications inbox** reading `intakes` for the
   staff's residence with actions: Accept → add to `waitlist` (numbered) or place
   directly into `beds`; on either outcome, write the status back and trigger the
   resident-facing prompt ("Check out the VRCC → vrcc.app") — in-app, plus the
   notifications fan-out once consent-gated channels are configured.
5. **Identity note (D-1):** the `intakes` → auth-user → resident chain is where
   the person/enrollment seam must be honored: one auth user, a residency
   *relationship* under Grace House — not a duplicate person record. The
   crosswalk (`gfa_identity`) is the bridge when the same person later completes
   VRCC onboarding (step 5 of the flow).

## Decision still owned by the owner

- When `recoveryresidence.app` is purchased/routed, it should point at the
  Residence OS worker (Cloudflare custom domain on account `thomas-499`), and
  every link in this contract that names the workers.dev URL gets updated.
