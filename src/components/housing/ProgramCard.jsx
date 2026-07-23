// components/housing/ProgramCard.jsx — a recovery residence from directory_entries,
// with live bed availability when beds are tracked.
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';

export default function ProgramCard({ program }) {
  const { ripple } = useQuantumMotion();
  const tracked = Number(program.beds_tracked || 0) > 0;
  const available = tracked ? Number(program.beds_available) : null;

  return (
    <motion.article {...ripple}
      className="rounded-3xl border border-moss-700 bg-moss-900/50 p-6 flex flex-col gap-3 shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl text-spore-100">{program.name}</h3>
        {tracked ? (
          <span className={`text-sm px-3 py-1 rounded-full whitespace-nowrap
            ${available > 0 ? 'bg-spore-500/20 text-spore-200' : 'bg-amber-400/15 text-amber-200'}`}
            aria-label={`${available} beds available`}>
            {available > 0 ? `${available} bed${available === 1 ? '' : 's'} open` : 'waitlist'}
          </span>
        ) : (
          <span className="text-sm px-3 py-1 rounded-full bg-moss-700/60 text-moss-200 capitalize">
            {program.availability || 'ask us'}
          </span>
        )}
      </div>
      {program.city && <p className="text-sm text-moss-300">{program.city}{program.county ? ` · ${program.county} Co.` : ''}</p>}
      {program.blurb && <p className="text-moss-200 text-sm">{program.blurb}</p>}
      <div className="mt-auto flex flex-wrap gap-3 pt-2">
        <Link to={`/housing/${program.id}`}
          className="min-h-[48px] inline-flex items-center px-5 rounded-xl border border-moss-600 text-moss-100">
          Rules & what to expect
        </Link>
        <Link to={`/housing/${program.id}/apply`}
          className="min-h-[48px] inline-flex items-center px-5 rounded-xl bg-spore-500 text-moss-950 font-semibold">
          Begin application
        </Link>
      </div>
    </motion.article>
  );
}
