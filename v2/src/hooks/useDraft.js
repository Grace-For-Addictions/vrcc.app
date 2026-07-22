import { useEffect, useRef, useState } from 'react'

/**
 * useDraft — auto-saving local drafts for long forms (housing wizard, evening
 * reflection). Persists to localStorage on every change, debounced, so a
 * dropped connection or closed tab never loses a rural applicant's progress.
 */
export function useDraft(key, initial) {
  const storageKey = `vrcc-draft:${key}`
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? { ...initial, ...JSON.parse(saved) } : initial
    } catch {
      return initial
    }
  })
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value))
      } catch {
        /* storage full/blocked: draft simply not persisted */
      }
    }, 400)
    return () => clearTimeout(timer.current)
  }, [storageKey, value])

  const clearDraft = () => localStorage.removeItem(storageKey)
  return [value, setValue, clearDraft]
}
