// src/pages/ApplyPage.jsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import HousingApplicationWizard from '../components/housing/HousingApplicationWizard';
import { useHousingStore } from '../stores/useHousingStore';

export default function ApplyPage() {
  const { id } = useParams();
  const { programs, fetchPrograms } = useHousingStore();
  useEffect(() => { if (!programs.length) fetchPrograms(); }, []);
  const program = programs.find((p) => p.id === id);
  if (!program) return <main className="p-8 text-moss-300">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-spore-100 mb-6">Apply to {program.name}</h1>
      <HousingApplicationWizard program={program} />
    </main>
  );
}
