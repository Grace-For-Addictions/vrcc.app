// The complete route table recovered from the production bundle (49 routes under
// base /vrcc/app/). Each entry carries the screen's group and the primary backend
// tables it is intended to read/write, so the skeleton documents real wiring.
// `tables` values are `schema.table` per analysis/data-model.md.

export const GROUPS = [
  'Onboarding', 'ICARE Path', 'Assessment & Intake', 'Wellness',
  'Companion & Support', 'Community', 'Resources', 'Documents',
];

export const ROUTES = [
  // Onboarding / identity
  { path: 'arrival', title: 'Arrival', group: 'Onboarding', tables: ['gfa_ui.participant_profiles'] },
  { path: 'getting-started', title: 'Getting Started', group: 'Onboarding', tables: ['gfa_ui.participant_profiles'] },
  { path: 'lobby', title: 'Lobby', group: 'Onboarding', tables: ['gfa_ui.access_requests'] },
  { path: 'consent', title: 'Consent', group: 'Onboarding', tables: ['gfa_ui.consent_tokens', 'gfa_ui.consent_records'] },
  { path: 'become-coach', title: 'Become a Coach', group: 'Onboarding', tables: ['gfa_ui.access_requests'], rpc: ['provision_coach_from_access_request'] },
  { path: 'my-profile', title: 'My Profile', group: 'Onboarding', tables: ['gfa_ui.user_profiles', 'gfa_ui.participant_profiles'] },

  // ICARE recovery path
  { path: 'icare-plan', title: 'ICARE Plan', group: 'ICARE Path', tables: ['gfa_ui.icare_plans', 'gfa_ui.icare_steps'] },
  { path: 'your-why', title: 'Your Why', group: 'ICARE Path', tables: ['gfa_ui.icare_plans'] },
  { path: 'goals', title: 'Goals', group: 'ICARE Path', tables: ['gfa_ui.goals', 'gfa_ui.milestones'] },
  { path: 'journey', title: 'Journey', group: 'ICARE Path', tables: ['gfa_ui.journey_events'] },
  { path: 'daily-practice', title: 'Daily Practice', group: 'ICARE Path', tables: ['gfa_ui.daily_cultivations'] },
  { path: 'reflection', title: 'Reflection', group: 'ICARE Path', tables: ['gfa_ui.reflections'] },
  { path: 'slogans', title: 'Slogans', group: 'ICARE Path', tables: ['gfa_ui.slogans', 'gfa_ui.slogan_practices', 'gfa_ui.slogan_assignments'] },
  { path: 'flashcards', title: 'Flashcards', group: 'ICARE Path', tables: ['gfa_ui.slogans'] },

  // Assessment / intake / life history
  { path: 'assessments', title: 'Assessments', group: 'Assessment & Intake', tables: ['gfa_ui.assessment_results', 'gfa_ui.assessments_ace'] },
  { path: 'recovery-capital', title: 'Recovery Capital', group: 'Assessment & Intake', tables: ['gfa_ui.participant_profiles'] },
  { path: 'life-history', title: 'Life History', group: 'Assessment & Intake', tables: ['gfa_ui.substance_use_history'] },
  { path: 'my-life', title: 'My Life', group: 'Assessment & Intake', tables: ['gfa_ui.housing_entries', 'gfa_ui.employment_entries'] },
  { path: 'substance-history', title: 'Substance History', group: 'Assessment & Intake', tables: ['gfa_ui.substance_use_history'] },
  { path: 'vulnerability', title: 'Vulnerability', group: 'Assessment & Intake', tables: ['gfa_ui.crisis_events'] },
  { path: 'financial', title: 'Financial', group: 'Assessment & Intake', tables: ['gfa_ui.employment_entries'] },
  { path: 'workforce', title: 'Workforce', group: 'Assessment & Intake', tables: ['gfa_ui.employment_entries', 'gfa_ui.volunteer_hours'] },

  // Wellness / self
  { path: 'check-in', title: 'Check-In', group: 'Wellness', tables: ['gfa_ui.check_in_records', 'gfa_ui.daily_check_ins', 'gfa_ui.weekly_check_ins'] },
  { path: 'wellness', title: 'Wellness', group: 'Wellness', tables: ['gfa_ui.participant_pulse'] },
  { path: 'wellness-toolbox', title: 'Wellness Toolbox', group: 'Wellness', tables: ['gfa_ui.participant_pulse'] },
  { path: 'brain-atlas', title: 'Brain Atlas', group: 'Wellness', tables: [] },
  { path: 'garden-dashboard', title: 'Garden Dashboard', group: 'Wellness', tables: ['gfa_ui.participant_pulse', 'gfa_ui.journey_events'] },
  { path: 'my-space', title: 'My Space', group: 'Wellness', tables: ['gfa_ui.room_visits'] },

  // Companion / support
  { path: 'grace', title: 'Grace', group: 'Companion & Support', tables: ['gfa_ui.grace_sessions'] },
  { path: 'companion', title: 'Companion', group: 'Companion & Support', tables: ['gfa_ui.grace_sessions'] },
  { path: 'support', title: 'Support', group: 'Companion & Support', tables: ['gfa_ui.support_network_members'] },
  { path: 'support-hub', title: 'Support Hub', group: 'Companion & Support', tables: ['gfa_ui.support_network_members'] },
  { path: 'support-network', title: 'Support Network', group: 'Companion & Support', tables: ['gfa_ui.support_network_members'] },
  { path: 'connects', title: 'Connects', group: 'Companion & Support', tables: ['gfa_engagement.sessions'] },
  { path: 'emergency-contacts', title: 'Emergency Contacts', group: 'Companion & Support', tables: ['gfa_ui.emergency_contacts'] },
  { path: 'messages', title: 'Messages', group: 'Companion & Support', tables: ['gfa_ui.notifications'] },

  // Community
  { path: 'community', title: 'Community', group: 'Community', tables: ['gfa_community.circle_sessions'] },
  { path: 'community-hub', title: 'Community Hub', group: 'Community', tables: ['gfa_community.circle_sessions'] },
  { path: 'coaching', title: 'Coaching', group: 'Community', tables: ['gfa_ui.coach_participant_assignments', 'gfa_ui.coaching_sessions'], rpc: ['my_core_coach_id'] },
  { path: 'meetings', title: 'Meetings', group: 'Community', tables: ['gfa_ui.booking_requests', 'gfa_ui.availability_slots'], rpc: ['materialize_booking_request'] },
  { path: 'memorial', title: 'Memorial', group: 'Community', tables: [] },
  { path: 'grace-harbor', title: 'Grace Harbor', group: 'Community', tables: ['gfa_community.circle_sessions'] },

  // Resources / maps
  { path: 'resources-hub', title: 'Resources Hub', group: 'Resources', tables: ['gfa_ui.referrals_resources'] },
  { path: 'iowa-map', title: 'Iowa Map', group: 'Resources', tables: [], note: 'Leaflet + maps.iowa-recovery.org' },
  { path: 'resource-map', title: 'Resource Map', group: 'Resources', tables: ['gfa_ui.referrals_resources'], note: 'Leaflet + ArcGIS/OSM tiles' },
  { path: 'interior', title: 'Interior', group: 'Resources', tables: [], note: 'three.js explorable space' },

  // Documents / forms
  { path: 'forms', title: 'Forms', group: 'Documents', tables: ['gfa_ui.participant_profiles'] },
  { path: 'participant-forms', title: 'Participant Forms', group: 'Documents', tables: ['gfa_ui.participant_profiles'] },
  { path: 'my-documents', title: 'My Documents', group: 'Documents', tables: ['gfa_ui.consent_records'] },
];
