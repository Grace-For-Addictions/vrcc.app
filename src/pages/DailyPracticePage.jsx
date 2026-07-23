// src/pages/DailyPracticePage.jsx
// The daily rhythm: morning before 3pm, evening after — but both always reachable.

import { useEffect, useState } from 'react';
import MorningIntention from '../components/checkins/MorningIntention';
import EveningReflection from '../components/checkins/EveningReflection';
import MyceliumTrendMap from '../components/quantum/MyceliumTrendMap';
import { useCheckinStore } from '../stores/useCheckinStore';
import { useAuthStore } from '../stores/useAuthStore';

export default function DailyPracticePage() {
  const profile = useAuthStore((s) => s.profile);
  const fetchToday = useCheckinStore((s) => s.fetchToday);
  const [tab, setTab] = useState(new Date().getHours() < 15 ? 'morning' : 'evening');

  useEffect(() => { if (profile?.id) fetchToday(profile.id); }, [profile?.id]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <header>
        <h1 className="font-display text-3xl text-spore-100">Daily Practice</h1>
        <p className="text-moss-300 mt-1">Small, repeated, real. This is how neurons — and lives — rewire.</p>
      </header>

      <div role="tablist" aria-label="Practice time" className="flex gap-2">
        {[['morning', '🌅 Morning'], ['evening', '🌙 Evening']].map(([v, label]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
            className={`min-h-[52px] flex-1 rounded-2xl border font-medium
              ${tab === v ? 'border-spore-400 bg-spore-500/15 text-spore-50' : 'border-moss-700 text-moss-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'morning' ? <MorningIntention /> : <EveningReflection />}

      <section aria-labelledby="map-h" className="pt-4">
        <h2 id="map-h" className="font-display text-2xl text-spore-100 mb-3">Your mycelium map</h2>
        <MyceliumTrendMap />
      </section>
    </main>
  );
}
