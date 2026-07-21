import { CANON } from '../lib/canonical';
export default function Home() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-teal font-semibold text-sm uppercase tracking-wide">{CANON.certification}</p>
        <h1 className="font-serif text-4xl mt-1">A safe place to land — and people who walk with you.</h1>
        <p className="text-muted mt-3 max-w-2xl">
          Grace House is a women-focused, peer-led recovery residence operated by {CANON.operator}.
          A home where accountability protects belonging and grace makes room for a future.
        </p>
      </section>
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          ['Peer-led & non-clinical', 'NARR Level II / Type M aligned. Staff are peer supporters with lived experience.'],
          ['Medication-affirming', 'All FDA-approved medications, including MOUD, are fully supported — never a violation.'],
          ['Supportive re-engagement', 'A return to use is met with support, never automatic discharge.'],
        ].map(([t, d]) => (
          <div key={t} className="bg-white rounded-2xl border border-line p-5 shadow-sm">
            <div className="font-semibold">{t}</div>
            <div className="text-sm text-muted mt-1">{d}</div>
          </div>
        ))}
      </section>
      <section className="bg-plum-light rounded-2xl p-5">
        <div className="text-sm">Reach us: <b>{CANON.contact.office}</b> · {CANON.contact.email} · Residents warmline <b>{CANON.contact.warmline}</b></div>
      </section>
    </div>
  );
}
