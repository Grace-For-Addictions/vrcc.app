import { useState } from 'react';
import { CANON, curfewFor, fmtTime } from '../lib/canonical';
import Signature, { type SignatureValue } from '../components/Signature';

/**
 * Guided resident onboarding — the directive's sequence, one step at a time.
 * Welcome → About You → Your Rights → Financial → Community Living → Safety →
 * Recovery → Permissions → Signature → Complete.
 * Collected values are held locally; the "Sign & complete" step is the wiring point
 * for gfa_residence.document_assignment + signature (immutable snapshot) — next phase.
 */
type Form = {
  first_name: string; preferred_name: string; pronouns: string; phone: string;
  my_why: string;
  ack_rights: boolean; ack_financial: boolean; ack_community: boolean; ack_safety: boolean;
  perm_emergency: boolean; perm_moud: boolean; perm_photo: boolean;
};
const EMPTY: Form = {
  first_name: '', preferred_name: '', pronouns: '', phone: '', my_why: '',
  ack_rights: false, ack_financial: false, ack_community: false, ack_safety: false,
  perm_emergency: false, perm_moud: false, perm_photo: false,
};

const RIGHTS = [
  'To be treated with dignity and respect at all times',
  'To choose your own treatment providers and recovery pathway',
  'To take all prescribed medications, including MOUD — never a violation, never a positive screen',
  'A return to use is met with support, never automatic discharge',
  'To file a grievance without any fear of retaliation',
  'To leave the program voluntarily at any time',
  'To be free from discrimination',
];

export default function ResidentOnboarding() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);
  const [sig, setSig] = useState<SignatureValue | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  const Ack = ({ k, label }: { k: keyof Form; label: string }) => (
    <label className="flex gap-3 items-start bg-plum-light rounded-xl p-3 cursor-pointer">
      <input type="checkbox" checked={f[k] as boolean} onChange={(e) => set(k, e.target.checked as never)} className="mt-1 accent-plum w-4 h-4" />
      <span className="text-sm">{label}</span>
    </label>
  );
  const Field = ({ k, label, ph }: { k: keyof Form; label: string; ph?: string }) => (
    <label className="block mb-3">
      <span className="text-sm font-semibold block mb-1">{label}</span>
      <input value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} placeholder={ph}
        className="w-full border border-line rounded-lg px-3 py-2" />
    </label>
  );

  const steps: { title: string; body: React.ReactNode; canNext?: boolean }[] = [
    { title: 'Welcome home', body: (
      <div className="space-y-3">
        <p>Welcome to <b>Grace House</b>. This short walkthrough helps us get to know you and makes sure you understand your rights and how the house works. You can pause and come back anytime — nothing is final until you sign at the end.</p>
        <p className="text-muted text-sm">{CANON.certification}. Operated by {CANON.operator}.</p>
      </div>
    ) },
    { title: 'About you', body: (
      <div>
        <Field k="first_name" label="First name" />
        <Field k="preferred_name" label="Preferred name (what should we call you?)" />
        <Field k="pronouns" label="Pronouns" ph="she/her, they/them…" />
        <Field k="phone" label="Phone" />
      </div>
    ), canNext: !!f.first_name.trim() },
    { title: 'Your rights', body: (
      <div className="space-y-3">
        <p className="text-sm text-muted">These rights are yours and cannot be waived.</p>
        <ul className="space-y-1.5">{RIGHTS.map((r) => <li key={r} className="flex gap-2 text-sm"><span className="text-teal">✓</span>{r}</li>)}</ul>
        <Ack k="ack_rights" label="I have read and understand my rights." />
      </div>
    ), canNext: f.ack_rights },
    { title: 'Financial participation', body: (
      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          {([['Double (shared) room', CANON.fees.double], ['Single (private) room', CANON.fees.single]] as const).map(([l, x]) => (
            <div key={l} className="border border-line rounded-xl p-4"><div className="font-semibold text-sm">{l}</div><div className="font-serif text-xl">${x.weekly}<span className="text-xs text-muted">/wk</span></div><div className="text-xs text-muted">or ${x.monthlyPrepaid}/mo paid in full in advance</div></div>
          ))}
        </div>
        <p className="text-xs text-muted">Deposit &amp; refund terms are being finalized (GH-D004). If cost is ever a barrier, talk to the House Manager — we work with you and never discharge someone simply for a payment hardship while we find a solution.</p>
        <Ack k="ack_financial" label="I understand the program fees and that I can talk to staff about a payment plan." />
      </div>
    ), canNext: f.ack_financial },
    { title: 'Community living', body: (
      <div className="space-y-3">
        <p className="text-sm">Curfew is phase-based and grows as you progress. It never goes past midnight. Quiet hours run from curfew to {fmtTime(CANON.curfew.quietEnd)}.</p>
        <div className="text-sm border border-line rounded-xl divide-y divide-line">
          {[1, 2, 3].map((p) => (
            <div key={p} className="flex justify-between p-2.5"><span>Phase {p}</span><span className="tabular-nums text-muted">{fmtTime(curfewFor(p as 1 | 2 | 3, 'sunThu'))} Sun–Thu · {fmtTime(curfewFor(p as 1 | 2 | 3, 'friSat'))} Fri–Sat</span></div>
          ))}
        </div>
        <Ack k="ack_community" label="I understand the curfew, quiet hours, and community expectations." />
      </div>
    ), canNext: f.ack_community },
    { title: 'Safety', body: (
      <div className="space-y-3">
        <ul className="space-y-1.5 text-sm">
          <li>• Naloxone (Narcan) is on-site; staff may administer it in a suspected opioid overdose.</li>
          <li>• In an emergency, staff call 911 first and support you.</li>
          <li>• Residents warmline: <b>{CANON.contact.warmline}</b> — reach a real person anytime.</li>
        </ul>
        <Ack k="ack_safety" label="I understand the safety and emergency procedures." />
      </div>
    ), canNext: f.ack_safety },
    { title: 'Your recovery', body: (
      <div className="space-y-3">
        <p className="text-sm text-muted">Recovery here moves through three phases of support — stabilization, integration, and preparation. We honor every pathway.</p>
        <label className="block"><span className="text-sm font-semibold block mb-1">Your "why" — what are you moving toward? (optional)</span>
          <textarea value={f.my_why} onChange={(e) => set('my_why', e.target.value)} rows={3} className="w-full border border-line rounded-lg px-3 py-2" placeholder="In your own words…" /></label>
      </div>
    ) },
    { title: 'Permissions', body: (
      <div className="space-y-2">
        <p className="text-sm text-muted">You're in control of these. You can change them anytime.</p>
        <Ack k="perm_emergency" label="Grace House may contact my emergency contact about safety concerns." />
        <Ack k="perm_moud" label="I understand my prescribed medications (including MOUD) are fully supported." />
        <Ack k="perm_photo" label="Optional: Grace House may use my photo/story (first name or anonymous) for program promotion. (You can decline — it won't affect your participation.)" />
      </div>
    ) },
    { title: 'Sign & complete', body: (
      <div className="space-y-3">
        <p className="text-sm">By signing below I confirm the information I provided is accurate and I voluntarily choose to participate in Grace House. This is a participation agreement, not a lease.</p>
        <Signature label="Your signature" onChange={setSig} />
        <p className="text-xs text-muted">Your signature is recorded with an immutable copy of what you signed and the date/time.</p>
      </div>
    ), canNext: !!sig },
  ];

  const last = step === steps.length - 1;
  const cur = steps[step];
  const pct = Math.round(((step + 1) / (steps.length + 1)) * 100);

  if (step === steps.length) {
    return (
      <div className="max-w-lg mx-auto text-center py-10 space-y-3">
        <div className="text-5xl">🌱</div>
        <h1 className="font-serif text-3xl">Welcome to Grace House{f.preferred_name || f.first_name ? `, ${f.preferred_name || f.first_name}` : ''}.</h1>
        <p className="text-muted">Your onboarding is complete and your signature is on file. Your peer coach will connect with you soon. You belong here already. 💜</p>
        <p className="text-xs text-muted">Next: this "Complete" step will save the signed Participant Agreement to your record (gfa_residence.document_assignment + signature) once resident sign-in is wired.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="h-2 bg-line rounded-full overflow-hidden mb-1"><div className="h-full bg-gradient-to-r from-teal to-plum" style={{ width: `${pct}%` }} /></div>
      <div className="text-xs text-muted mb-5">Step {step + 1} of {steps.length}</div>
      <h1 className="font-serif text-3xl mb-4">{cur.title}</h1>
      <div className="mb-6">{cur.body}</div>
      <div className="flex justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="px-5 py-2.5 rounded-lg border border-line font-semibold disabled:opacity-40">Back</button>
        <button onClick={() => setStep((s) => s + 1)} disabled={cur.canNext === false}
          className="px-6 py-2.5 rounded-lg bg-plum text-white font-semibold disabled:opacity-40">{last ? 'Sign & complete' : 'Continue'}</button>
      </div>
    </div>
  );
}
