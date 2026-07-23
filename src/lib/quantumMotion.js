// src/lib/quantumMotion.js
// Shared Framer Motion variants for the Quantum UI Kit.
// Every export respects prefers-reduced-motion via useQuantumMotion().

import { useReducedMotion } from 'framer-motion';

export const ripple = {
  initial: { scale: 0.96, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } },
  exit:    { scale: 0.98, opacity: 0, transition: { duration: 0.25 } },
};

export const collapse = { // "observation collapses the waveform" — commit moments
  initial: { opacity: 0, filter: 'blur(6px)', y: 10 },
  animate: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export const myceliumGrow = (i = 0) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1, transition: { delay: 0.12 * i, duration: 1.1, ease: 'easeInOut' } },
});

export const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

/** Returns motion-safe variants: static when the user prefers reduced motion. */
export function useQuantumMotion() {
  const reduced = useReducedMotion();
  const still = { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
  return {
    reduced,
    ripple:   reduced ? still : ripple,
    collapse: reduced ? still : collapse,
    stagger:  reduced ? {} : stagger,
    grow: (i) => (reduced ? { initial: { pathLength: 1, opacity: 1 }, animate: {} } : myceliumGrow(i)),
  };
}
