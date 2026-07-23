// src/pages/AdminHousingPage.jsx
// Navigator/Admin/House Manager: application review + real-time bed board.

import { useEffect, useState } from 'react';
import ApplicationReviewList from '../components/housing/ApplicationReviewList';
import BedManagementBoard from '../components/housing/BedManagementBoard';
import { useHousingStore } from '../stores/useHousingStore';

export default function AdminHousingPage() {
  const { programs, fetchPrograms } = useHousingStore();
  const [programId, setProgramId] = useState(null);

  useEffect(() => { fetchPrograms(); }, []);
  useEffect(() => { if (!programId && programs.length) setProgramId(programs[0].id); }, [programs]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl text-spore-100">Housing Operations</h1>
        <select value={programId ?? ''} onChange={(e) => setProgramId(e.target.value)}
          aria-label="Select program"
          className="min-h-[48px] rounded-xl bg-moss-900 border border-moss-700 px-4 text-moss-100">
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </header>
      {programId && <BedManagementBoard programId={programId} />}
      {programId && <ApplicationReviewList programId={programId} />}
    </main>
  );
}
