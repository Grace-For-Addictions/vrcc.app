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

## Who implements what

1. **Flagship session (vrcc.app):** point the "Residences" nav item at the
   directory (host `residences/index.html` at `vrcc.app/residences`, or absorb
   the page as a route). One-line change.
2. **This repo (done):** `residences/index.html` — directory with Grace House →
   gracehouse4.pages.dev, 4-step "how applying works", 988 footer, back-to-Center.
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
