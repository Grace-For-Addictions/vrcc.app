# Residence Shell — Blueprint Adoption & Canonical Mapping

**Date:** 2026-07-28 · **Source:** owner-supplied "Recovery Residence — Universal
Recovery Housing Platform" single-file prototype → adopted as the **Recovery
Residence Workspace shell** (Deliverable 8, ecosystem product #3).

## Governance placement (Section 17 check)

- **Who is it for?** Residence operators (Executive Director, House Lead) and, in a
  later phase, residents. Multi-tenant by design → this is also the seed of the
  **White Label Platform** concept (ecosystem product #8).
- **Does the capability already exist?** Partially — this is why it must NOT ship a
  new schema. Its 10 modules map onto the canonical residence backend below.
- **Where does it live?** `residence/index.html` — a standalone shell alongside the
  other apps, per the Option-C architecture. It resolves the **UX half of GH-D100**;
  the stack half (whether the production build stays single-file or becomes
  React/TS) remains an owner decision.
- **What shipped now vs. later?** Shipped: the working shell with localStorage
  persistence (usable today, zero backend risk, honors the Phase-0 schema freeze).
  Not shipped: Supabase wiring — blocked intentionally on D-1 ratification and
  GH-D101 (dev-branch discipline). Changes from the supplied prototype: localStorage
  persistence + auto-resume, and one bug fix (dashboard "Acknowledge" serialized a
  closure into `onclick`, which threw at click time; now an action string).

## Module → canonical backend mapping

| Prototype module | Canonical home (exists?) | Gap / migration needed |
|---|---|---|
| Residence profile / multi-tenant orgs | `gfa_residence.residences` (3 rows) + `public.organizations` | Add commitments/curfew/lead fields if absent |
| Beds | `gfa_residence.beds` (17) — **canonical per D-1**; retires `public.residence_beds`, `v2_housing_beds` | Status vocabulary alignment (available/reserved/maintenance/occupied) |
| Waitlist | `gfa_residence.waitlist` | Priority + notes columns check |
| Residents & phases | `gfa_ui.residents` / `gfa_residence` phase_history + identity seam (`person` model) | Wire to crosswalk, NOT a new residents table |
| Payments / balances | `gfa_residence.fee_ledger` | Receipts; Stripe later |
| Daily check-ins (mood/cravings/support flag) | **Decision:** residence check-in vs. participant daily practice (`v2_daily_checkins` model) — related but distinct consent contexts | Likely new `gfa_residence.resident_checkins`; do not fork the participant check-in |
| Furloughs | none — gracehouse plan's pass/curfew logic (policy engine) | New `gfa_residence.furloughs`, policy-engine-aware |
| Grievances | none — gracehouse plan references grievance notice; SLA text matches its standards | New `gfa_residence.grievances` with SLA timestamps |
| Announcements | none residence-scoped | New `gfa_residence.announcements` |
| Alerts engine | derived — views over the above | Views, no tables |

**Rule reaffirmed:** none of these migrations ship until D-1 is ratified, and then
only via a Supabase dev branch (GH-D101). The shell runs fully on localStorage
until that day, which makes it safe to use, demo, and iterate on immediately.
