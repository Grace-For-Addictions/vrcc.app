// src/components/quantum/MyceliumTrendMap.jsx
// Renders the last 30 days of practice as a living mycelium network.
// Each day is a node; hyphal threads grow between consecutive days.
// Node size = BARC pulse, glow = movement done, spore ring = declaration made.
// Neuroplasticity made visible: "what fires together, wires together."

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useCheckinStore } from '../../stores/useCheckinStore';
import { useAuthStore } from '../../stores/useAuthStore';

export default function MyceliumTrendMap({ days = 30 }) {
  const { grow, reduced } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const { trends, fetchTrends } = useCheckinStore();

  useEffect(() => { if (profile?.id) fetchTrends(profile.id, days); }, [profile?.id, days]);

  const W = 720, H = 260;
  const nodes = useMemo(() => {
    if (!trends.length) return [];
    return trends.map((t, i) => {
      const x = 40 + (i / Math.max(trends.length - 1, 1)) * (W - 80);
      // Organic wander: deterministic pseudo-random y per date, weighted by BARC
      const seed = t.checkin_date.split('-').reduce((a, b) => a + Number(b), 0);
      const wobble = Math.sin(seed * 2.7) * 55;
      const lift = t.barc_pulse ? (Number(t.barc_pulse) - 3.5) * 18 : 0;
      return {
        ...t,
        x, y: H / 2 + wobble - lift,
        r: 5 + (t.barc_pulse ? Number(t.barc_pulse) * 1.6 : 4),
      };
    });
  }, [trends]);

  if (!nodes.length) {
    return (
      <div className="rounded-3xl border border-moss-700 bg-moss-900/40 p-8 text-center">
        <p className="text-moss-300">Your mycelium map begins with your first check-in.</p>
        <p className="text-moss-500 text-sm mt-1">Every practice becomes a node. Every streak becomes a thread.</p>
      </div>
    );
  }

  return (
    <figure aria-label={`Recovery practice map, last ${days} days`}
      className="rounded-3xl border border-moss-700 bg-gradient-to-b from-moss-950 to-moss-900 p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px] w-full" role="img"
        aria-describedby="mycelium-desc">
        <desc id="mycelium-desc">
          {nodes.length} days of practice. Larger, brighter nodes reflect higher recovery-capital pulses,
          glowing nodes mark days with BDNF movement, ringed nodes mark declared.
        </desc>
        <defs>
          <radialGradient id="spore-glow">
            <stop offset="0%" stopColor="#7ee8c7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7ee8c7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Hyphal threads between consecutive days */}
        {nodes.slice(1).map((n, i) => {
          const p = nodes[i];
          const mx = (p.x + n.x) / 2, my = (p.y + n.y) / 2 + 14;
          return (
            <motion.path key={n.checkin_date} {...grow(i)}
              d={`M ${p.x} ${p.y} Q ${mx} ${my} ${n.x} ${n.y}`}
              fill="none" stroke="#3d6b52" strokeWidth={1.6} strokeLinecap="round" />
          );
        })}

        {/* Day nodes */}
        {nodes.map((n, i) => (
          <g key={n.checkin_date}>
            {n.moved && <circle cx={n.x} cy={n.y} r={n.r * 2.4} fill="url(#spore-glow)" opacity={0.5} />}
            <motion.circle
              cx={n.x} cy={n.y} r={n.r}
              fill={n.barc_pulse ? '#a982f8' : '#3f375a'}
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reduced ? 0 : 0.1 * i, type: 'spring', stiffness: 160, damping: 14 }}
            >
              <title>
                {new Date(n.checkin_date + 'T12:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
                {n.barc_pulse ? ` · pulse ${n.barc_pulse}` : ''}
                {n.moved ? ' · moved 🌿' : ''}
                {Number(n.declared) > 0 ? ' · declared ✦' : ''}
              </title>
            </motion.circle>
            {Number(n.declared) > 0 && (
              <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke="#e8c87e" strokeWidth={1.4} strokeDasharray="3 3" />
            )}
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-moss-400 px-2">
        <span>● node size = BARC pulse</span>
        <span className="text-spore-300">◉ glow = BDNF movement</span>
        <span className="text-amber-200">◌ ring = declaration</span>
      </figcaption>
    </figure>
  );
}
