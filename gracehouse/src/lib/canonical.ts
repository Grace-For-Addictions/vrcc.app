// Canonical policy values for the Grace House frontend.
// SINGLE SOURCE for the UI until wired to gfa_residence.policy_version (GH-*-001).
// Mirrors the seeded policy engine; the app must never scatter these values elsewhere.
export const CANON = {
  residence: 'Grace House',
  operator: 'Grace For Addictions, a 501(c)(3) nonprofit',
  address: '1311 9th Street, Des Moines, Iowa 50314',
  certification: 'Preparing for NARR Level II certification', // never "certified"
  contact: { office: '515-220-8771', email: 'gracehouse@graceforaddictions.org', warmline: '515-310-DIAL (3425)' },
  fees: {
    double: { weekly: 175, monthlyPrepaid: 650 },
    single: { weekly: 200, monthlyPrepaid: 700 },
    monthlyRequiresFullAdvance: true,
    deposit: null as number | null, // GH-D004 — pending leadership decision
    refund: null as string | null,  // GH-D004
  },
  // GH-CURFEW-001 v2.0 — hard ceiling: never past midnight.
  curfew: {
    ceiling: '24:00',
    quietEnd: '07:00',
    phases: {
      1: { sunThu: '21:00', friSat: '22:00' },
      2: { sunThu: '22:00', friSat: '23:00' },
      3: { sunThu: '23:00', friSat: '24:00' },
    },
  },
} as const;

export type Phase = 1 | 2 | 3;

// Curfew ceiling assertion mirrored from the DB validator — a curfew may never exceed midnight.
function toMinutes(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
export function curfewFor(phase: Phase, day: 'sunThu' | 'friSat'): string {
  const v = CANON.curfew.phases[phase][day];
  if (toMinutes(v) > toMinutes('24:00')) throw new Error(`Curfew ${v} exceeds the midnight ceiling`);
  return v;
}
export function fmtTime(t: string): string {
  if (t === '24:00') return '12:00 AM';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}
// Prohibited terms (GH-LANG-001) — used by dev-time language checks.
export const PROHIBITED_TERMS = ['addict', 'clean', 'dirty', 'offender', 'relapse'];
