// src/pages/ProgramDetailPage.jsx
// Rules & Expectations viewable BEFORE applying + live bed count + apply CTA.

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHousingStore } from '../stores/useHousingStore';

export default function ProgramDetailPage() {
  const { id } = useParams();
  const { programs, fetchPrograms, fetchProgram } = useHousingStore();
  const [entry, setEntry] = React.useState(null);
  useEffect(() => { if (!programs.length) fetchPrograms(); fetchProgram(id).then(setEntry); }, [id]);
  const summary = programs.find((p) => p.id === id);
  const program = entry ? { ...entry, ...(summary || {}) } : summary;
  if (!program) return <main className="p-8 text-moss-300">Loading…</main>;
  const tracked = Number(program.beds_tracked || 0) > 0;
  const open = tracked ? Number(program.beds_available) : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <header>
        <h1 className="font-display text-4xl text-spore-100">{program.name}</h1>
        <p className="text-moss-300 mt-1">{program.city}, {program.county} County · Iowa</p>
        <p aria-live="polite" className="mt-3 inline-block rounded-full bg-spore-500/15 text-spore-200 px-4 py-2">
          {tracked ? (open > 0 ? `${open} bed${open === 1 ? '' : 's'} available right now` : 'Beds full — waitlist is open and moves often') : (program.availability === 'open' ? 'Accepting applications' : 'Reach out — availability changes often')}
        </p>
      </header>

      <p className="text-lg text-moss-100">{program.blurb}</p>

      {(program.rules ?? []).length === 0 && (program.expectations ?? []).length === 0 && (
        <p className="text-moss-300">House rules will appear here soon — ask your navigator for the current handbook.</p>
      )}
      <section aria-labelledby="rules-detail">
        <h2 id="rules-detail" className="font-display text-2xl text-spore-100 mb-3">House rules</h2>
        <div className="space-y-3">
          {(program.rules ?? []).map((r) => (
            <div key={r.title} className="rounded-2xl border border-moss-700 bg-moss-900/40 p-4">
              <p className="font-semibold text-spore-100">{r.title}</p>
              <p className="text-moss-200 mt-1">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="expect-detail">
        <h2 id="expect-detail" className="font-display text-2xl text-spore-100 mb-3">What we owe you</h2>
        <div className="space-y-3">
          {(program.expectations ?? []).map((e) => (
            <div key={e.title} className="rounded-2xl border border-lichen-500/30 bg-lichen-500/5 p-4">
              <p className="font-semibold text-lichen-100">{e.title}</p>
              <p className="text-moss-200 mt-1">{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Link to={`/housing/${program.id}/apply`}
        className="block text-center min-h-[56px] leading-[56px] rounded-2xl bg-spore-500 text-moss-950 font-semibold text-lg shadow-glow">
        Begin my application
      </Link>
    </main>
  );
}
