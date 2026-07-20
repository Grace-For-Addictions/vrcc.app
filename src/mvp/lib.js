// Shared logic for the GFA VRCC MVP: auth/role, participant records,
// BARC-10 assessment, and small lookups. Person-first language throughout.
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Auth + role
// ---------------------------------------------------------------------------
export async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}

// Resolve the caller's role. Uses the server-side get_my_role() (reads
// app_users.role, defaults 'participant'), then refines with membership checks.
export async function resolveRole(user) {
  if (!user) return 'anon';
  let role = 'participant';
  try {
    const { data } = await supabase.rpc('get_my_role');
    if (data) role = data;
  } catch {
    /* default participant */
  }
  return role;
}

export const isCoachRole = (r) =>
  ['coach', 'peer_support', 'peer_coach', 'navigator'].includes(r);
export const isAdminRole = (r) => r === 'admin';

// ---------------------------------------------------------------------------
// Participant record (public.participants, keyed by supabase_user_id)
// ---------------------------------------------------------------------------
export async function getMyParticipant(user) {
  if (!user) return null;
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('supabase_user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Ensure a participants row exists for this auth user; create a minimal one if not.
export async function ensureMyParticipant(user) {
  let p = await getMyParticipant(user);
  if (p) return p;
  const meta = user.user_metadata || {};
  const first = meta.first_name || (user.email ? user.email.split('@')[0] : 'Friend');
  const last = meta.last_name || '';
  // org_id must be 'gfa' to satisfy the participants_own_insert RLS check.
  // participant_id, schema_id, status, timestamps all have DB defaults.
  const { data, error } = await supabase
    .from('participants')
    .insert({
      supabase_user_id: user.id,
      org_id: 'gfa',
      first_name: first,
      last_name: last || '—',
      email: user.email,
      intake_complete: false,
      barc10_complete: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// BARC-10 — Brief Assessment of Recovery Capital (10 items, 1–6 Likert)
// ---------------------------------------------------------------------------
export const BARC10_ITEMS = [
  'I have the support of people who believe in my recovery.',
  'I feel like I belong to a community that supports my recovery.',
  'The things I do add value to the people and world around me.',
  'I get emotional support from friends or family when I need it.',
  'I have enough energy to complete the things I set out to do.',
  'My life is meaningful and fulfilling without needing to use.',
  'In general, I am happy with my life today.',
  'I have people I can rely on to stand with me in my recovery.',
  'I am making good progress on my recovery journey.',
  'There are things in my life I look forward to.',
];

export const BARC10_SCALE = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Slightly disagree' },
  { value: 4, label: 'Slightly agree' },
  { value: 5, label: 'Agree' },
  { value: 6, label: 'Strongly agree' },
];

export const BARC_THRESHOLD = 47; // total >= 47 => strong recovery capital

// Parable-of-the-sower soil types (matches gfa_lookup.lkp_soil_type)
export function soilForScore(total) {
  if (total >= BARC_THRESHOLD)
    return { code: 'good', label: 'Good Soil', emoji: '🌱', description: 'Grounded and open' };
  if (total >= 38)
    return { code: 'thorny', label: 'Thorny Soil', emoji: '🌓', description: 'Growth crowded by worries' };
  if (total >= 26)
    return { code: 'rocky', label: 'Rocky Soil', emoji: '🌒', description: 'Struggling to find roots' };
  return { code: 'path', label: 'Path Soil', emoji: '🌑', description: 'Hard and exposed right now' };
}

export function barcInsight(total) {
  const soil = soilForScore(total);
  const base = {
    good: 'You have real recovery capital to build on — supportive people, energy, and meaning. A coach can help you protect and grow it.',
    thorny: 'There is genuine growth happening, but worries and pressures are crowding it. A coach can help clear space for what matters.',
    rocky: 'You are working hard to find footing. A coach can help you put down roots one connection at a time.',
    path: 'Right now things feel hard and exposed — and you still showed up. That matters. A coach will meet you exactly where you are.',
  }[soil.code];
  return base;
}

// ---------------------------------------------------------------------------
// Small intake lookups (kept light for the MVP)
// ---------------------------------------------------------------------------
export const PRONOUNS = ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'Prefer to self-describe', 'Prefer not to say'];
export const HOUSING = ['Stable / permanent', 'Temporary / staying with others', 'Recovery residence', 'Shelter', 'Unsheltered', 'Prefer not to say'];
export const TRANSPORT = ['Reliable vehicle', 'Public transit', 'Rides from others', 'Limited / none', 'Prefer not to say'];
export const REFERRAL_SOURCES = ['Self', 'Friend or family', 'Treatment provider', 'Court / probation', 'Hospital / ER', 'Community organization', 'Online / social media', 'Other'];

export function displayName(p) {
  if (!p) return 'Friend';
  return p.preferred_name || p.first_name || 'Friend';
}

// ---------------------------------------------------------------------------
// Gate 19B — continuity-of-connection helpers
// Invariant: every participant always has a next step; every follow-up has a
// due state; every overdue/quiet connection surfaces to a coach.
// ---------------------------------------------------------------------------

// The participant home is never a dead end — there is always an answer to
// "what should I do next?", even before a coach sets one.
export function defaultNextStep(participant) {
  if (!participant) return 'Take a breath. You showed up — that matters. 💚';
  if (!participant.assigned_coach_email)
    return 'You’re being matched with a peer recovery coach. They’ll reach out here soon — no rush.';
  return 'Say hello to your coach, or request a session when you’re ready.';
}

export function participantNextStep(participant) {
  const s = participant?.current_next_step;
  return s && s.trim() ? s.trim() : defaultNextStep(participant);
}

// Classify a participant for the coach attention queue. Returns null when
// nothing needs attention. Urgency order: overdue follow-up > never contacted
// > gone quiet > no follow-up planned.
export function attentionFor(p, opts = {}) {
  const staleDays = opts.staleDays ?? 10;
  const now = Date.now();
  const last = p.last_contact_at ? new Date(p.last_contact_at).getTime() : null;
  const due = p.next_follow_up_due ? new Date(`${p.next_follow_up_due}T23:59:59`).getTime() : null;

  if (due != null && due < now)
    return { level: 'overdue', label: 'Follow-up overdue', tone: 'red' };
  if (last == null)
    return { level: 'new', label: 'Never contacted', tone: 'amber' };
  if (now - last > staleDays * 864e5)
    return { level: 'quiet', label: `No contact in ${staleDays}+ days`, tone: 'amber' };
  if (due == null)
    return { level: 'no_followup', label: 'No follow-up set', tone: 'gray' };
  return null;
}
