import { useEffect, useRef, useState } from 'react'

/**
 * useQuantumMotion — gentle organic motion for the mycelium map and ambient
 * accents. Returns a phase value in [0, 1) advancing on requestAnimationFrame.
 * Respects prefers-reduced-motion by freezing at phase 0 (static render).
 */
export function useQuantumMotion(periodMs = 6000) {
  const [phase, setPhase] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return undefined

    let start
    const step = (t) => {
      if (start === undefined) start = t
      setPhase(((t - start) % periodMs) / periodMs)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)

    const onChange = () => {
      if (reduced.matches && raf.current) {
        cancelAnimationFrame(raf.current)
        setPhase(0)
      }
    }
    reduced.addEventListener('change', onChange)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      reduced.removeEventListener('change', onChange)
    }
  }, [periodMs])

  return phase
}
