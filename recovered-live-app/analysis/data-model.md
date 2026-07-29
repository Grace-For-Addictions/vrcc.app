# Recovered data model — what the live app actually calls

Extracted directly from `dist/assets/index-DMwbAUg-.js` (the app bundle). These are the exact
`.schema()`, `.from()`, and `.rpc()` calls the production app makes against Supabase
`ykykeioydvtxpyreshhs`.

## Schemas used (by call count)

| Schema | Calls | Role |
|---|---:|---|
| `gfa_ui` | 124 | **Primary** — the app's main data surface |
| `gfa_core` | 14 | Identity / roles |
| `gfa_engagement` | 13 | Sessions, coaching, engagement |
| `gfa_community` | 8 | Community / social |
| `gfa_residence` | 2 | **Light** residence features only |
| `gfa_personality` | 2 | |
| `gfa_icare` | 1 | ICARE plan data |
| `gfa_session` | 1 | |

## RPCs called

`get_my_role`, `get_lookup`, `my_core_participant_id`, `my_core_coach_id`,
`materialize_booking_request`, `provision_coach_from_access_request`, `admin_get_all_users`,
`admin_set_role`.

## Tables referenced (by call count, table name as passed to `.from()`)

Participant/identity: `participant_profiles` (25), `user_profiles` (8), `participants` (7),
`app_users` (2), `role_preassignments` (3), `privacy_preferences` (2), `consent_tokens` (3),
`consent_records`, `emergency_contacts` (7).

Access / coaching: `access_requests` (12), `sessions` (10), `coach_participant_assignments` (5),
`coach_profiles` (3), `coach_alerts` (2), `coaches`, `coach_notes`, `coaching_sessions`,
`booking_requests`, `availability_slots`, `session_events`, `grace_sessions`, `circle_sessions`.

Recovery content: `icare_plans` (6), `icare_steps` (3), `journey_events` (6),
`daily_cultivations` (6), `slogans` (5), `slogan_practices` (2), `slogan_assignments` (2),
`slogan_recommendations`, `reflections` (2), `goals`, `milestones`, `daily_check_ins`,
`check_in_records` (4), `weekly_check_ins`, `participant_pulse` (6), `outcomes` (4),
`assessment_results` (2), `assessments_ace` (2), `recovery_capital` (via profiles).

Life-history intake: `substance_use_history` (4), `housing_entries` (3), `employment_entries` (3),
`support_network_members` (4), `support_network`, `crisis_events` (3), `crisis_handoffs`,
`referrals_resources`, `volunteer_hours`, `workforce`.

Residence (light): `residences` (2), `beds`, `waitlist`, `residence_availability`,
`iowa_hhs_checklist`, `drug_tests`, `exhibit_e_reports`, `public_profiles`.

Other: `notifications` (2), `staff_notifications`, `event_log`, `room_visits` (3),
`narcan_trainings`, `narcan_records`, `organizations`, `wix_contact_submissions`,
`lkp_outcome_type`, `lkp_outcome_status`, `lkp_icare_plan_status`, `lkp_icare_phase`.

## ⚠️ Consolidation-critical finding

The live app references **neither Grace House policy/document lineage**:

- No `policy` / `policy_version` (this session's build)
- No `policies` / `policy_versions` / `policy_acknowledgments` (the `oqjtik` build)
- No `document_template` / `signature` (this session) and no `gh_documents` / `gh_document_signatures` (`oqjtik`)

Its `gfa_residence` use is limited to `residences`, `beds`, `waitlist`, `residence_availability`,
`iowa_hhs_checklist`, `drug_tests`. **Conclusion:** both duplicate Grace House policy/document
stacks in `gfa_residence` are currently un-wired backend scaffolding — the deployed app consumes
neither. This makes the deduplication in `docs/branch-consolidation-audit.md` §5 lower-risk than
first assessed: retiring one duplicate stack cannot break the live app, because the live app does
not call either one.
