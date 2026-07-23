// src/pages/HousingPage.jsx
// Resource Hub + Iowa housing programs with live availability.

import { useEffect } from 'react';
import ResourceHub from '../components/housing/ResourceHub';
import ProgramCard from '../components/housing/ProgramCard';
import { useHousingStore } from '../stores/useHousingStore';

export default function HousingPage() {
  const { programs, availability, fetchPrograms } = useHousingStore();
  useEffect(() => { fetchPrograms(); }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <header>
        <h1 className="font-display text-3xl text-spore-100">Resources & Recovery Housing</h1>
        <p className="text-moss-300 mt-1">Iowa-focused, rural-first, every pathway welcome.</p>
      </header>

      <section aria-labelledby="prog-h" className="space-y-4">
        <h2 id="prog-h" className="font-display text-2xl text-spore-100">Recovery residences</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} availability={availability[p.id]} />
          ))}
        </div>
      </section>

      <section aria-labelledby="hub-h" className="space-y-4">
        <h2 id="hub-h" className="font-display text-2xl text-spore-100">Resource Hub</h2>
        <ResourceHub />
      </section>
    </main>
  );
}
