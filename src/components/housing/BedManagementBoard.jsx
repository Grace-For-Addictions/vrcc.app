// src/components/housing/BedManagementBoard.jsx
// Real-time bed board — a simple flat list of beds (no room groupings).
// Tap a bed to cycle its status; offline beds join the cycle so placeholder
// beds can be brought online the moment they're verified (GH-D003).
// "Add a bed" lets the house grow without touching the database by hand.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useHousingStore } from '../../stores/useHousingStore';

const NEXT = { offline: 'available', available: 'hold', hold: 'occupied', occupied: 'offline' };
const STYLES = {
  available: 'border-spore-500/60 bg-spore-500/15 text-spore-100',
  hold:      'border-amber-400/50 bg-amber-400/10 text-amber-100',
  occupied:  'border-lichen-400/50 bg-lichen-500/10 text-lichen-100',
  offline:   'border-moss-700 border-dashed bg-moss-900/40 text-moss-400',
};
const HINT = {
  available: 'tap to hold',
  hold: 'tap to occupy',
  occupied: 'tap to take offline',
  offline: 'tap to bring online',
};

export default function BedManagementBoard({ programId }) {
  const { stagger, collapse } = useQuantumMotion();
  const { beds, fetchBeds, addBed, setBedStatus, subscribeBeds } = useHousingStore();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBeds(programId);
    return subscribeBeds(programId);   // realtime — every screen updates instantly
  }, [programId]);

  // "Bed 3" sorts before "Bed 10"
  const sorted = [...beds].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }));
  const counts = beds.reduce((a, b) => ({ ...a, [b.status]: (a[b.status] ?? 0) + 1 }), {});

  const handleAdd = async () => {
    setAdding(true);
    const nums = beds.map((b) => parseInt(String(b.label).replace(/\D/g, ''), 10)).filter(Number.isFinite);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    await addBed(programId, `Bed ${next}`);
    setAdding(false);
  };

  return (
    <section aria-labelledby="beds-h" className="space-y-5">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="beds-h" className="font-display text-2xl text-spore-100">Bed board</h2>
        <p className="text-moss-300 text-sm" aria-live="polite">
          {counts.available ?? 0} available · {counts.hold ?? 0} held · {counts.occupied ?? 0} occupied
          {counts.offline ? ` · ${counts.offline} offline` : ''}
        </p>
      </header>

      <motion.ul variants={stagger} initial="initial" animate="animate"
        className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {sorted.map((b) => (
          <motion.li key={b.id} variants={collapse}>
            <button
              onClick={() => setBedStatus(b.id, NEXT[b.status] ?? 'available', programId)}
              aria-label={`${b.label}, currently ${b.status}. ${HINT[b.status] ?? 'Activate to change status.'}`}
              className={`w-full min-h-[96px] rounded-2xl border p-4 text-left transition-colors
                focus-visible:ring-4 ring-spore-400/60 ${STYLES[b.status] ?? STYLES.offline}`}>
              <span className="block font-semibold text-lg">{b.label}</span>
              <span className="block text-sm capitalize mt-1 opacity-80">{b.status}</span>
              <span className="block text-xs mt-1 opacity-60">{HINT[b.status]}</span>
            </button>
          </motion.li>
        ))}

        <li>
          <button onClick={handleAdd} disabled={adding}
            aria-label="Add a bed"
            className="w-full min-h-[96px] rounded-2xl border border-dashed border-spore-500/40 text-spore-300
              hover:bg-spore-500/10 transition-colors focus-visible:ring-4 ring-spore-400/60 disabled:opacity-50">
            <span className="block text-2xl" aria-hidden>＋</span>
            <span className="block text-sm mt-1">{adding ? 'Adding…' : 'Add a bed'}</span>
          </button>
        </li>
      </motion.ul>

      <p className="text-xs text-moss-500">
        Tap a bed to cycle: offline → available → hold → occupied → offline. Offline beds are
        never shown as availability to participants. Changes ripple to every screen instantly.
      </p>
    </section>
  );
}
