import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useQuantumMotion } from '../../hooks/useQuantumMotion'

/**
 * TrendMap — the mycelium growth map. Each check-in day is a node on an
 * organic vine; encoding:
 *   node size  = BARC recovery pulse (1–10)
 *   soft glow  = moved_body (the day you fed your brain)
 *   gold ring  = declaration spoken
 *   dim seed   = day with no check-in (the vine persists; gaps are not shame)
 * Connecting hyphae thicken with the 7-day average, so a strengthening month
 * literally looks like a root system taking hold.
 */
const W = 720
const H = 320
const DAYS = 30

export default function TrendMap({ profile }) {
  const [rows, setRows] = useState([])
  const phase = useQuantumMotion(8000)
  const scrollRef = useRef(null)

  // On narrow screens the map scrolls horizontally; start at the newest days.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [rows])

  useEffect(() => {
    supabase
      .from('v2_checkin_trends')
      .select('*')
      .eq('participant_id', profile.id)
      .order('checkin_date', { ascending: true })
      .then(({ data }) => setRows(data || []))
  }, [profile.id])

  const nodes = useMemo(() => {
    const byDate = Object.fromEntries(rows.map((r) => [r.checkin_date, r]))
    const out = []
    const today = new Date()
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const idx = DAYS - 1 - i
      const t = idx / (DAYS - 1)
      out.push({
        iso,
        row: byDate[iso] || null,
        // gentle sine meander gives the vine its organic path
        x: 40 + t * (W - 80),
        y: H / 2 + Math.sin(idx * 0.7) * 60 + Math.sin(idx * 0.23) * 28,
      })
    }
    return out
  }, [rows])

  const path = useMemo(() => {
    if (nodes.length === 0) return ''
    return nodes
      .map((n, i) => {
        if (i === 0) return `M ${n.x} ${n.y}`
        const prev = nodes[i - 1]
        const cx = (prev.x + n.x) / 2
        return `C ${cx} ${prev.y}, ${cx} ${n.y}, ${n.x} ${n.y}`
      })
      .join(' ')
  }, [nodes])

  const checkedDays = rows.filter((r) => r.did_morning || r.did_evening).length
  const declarations = rows.filter((r) => r.declaration).length
  const avgPulse = rows.length
    ? (rows.reduce((s, r) => s + (r.barc_pulse || 0), 0) / rows.filter((r) => r.barc_pulse).length || 0)
    : 0
  const breathe = 1 + 0.04 * Math.sin(phase * Math.PI * 2)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-grace-800">Your growth map</h1>
      <p className="text-grace-600">
        Thirty days of practice as a living root system. Bigger nodes are stronger
        days; the gold rings are days you spoke your declaration.
      </p>

      <div ref={scrollRef} className="card overflow-x-auto p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-[560px]"
          role="img"
          aria-label={`Growth map: ${checkedDays} of the last 30 days practiced, ${declarations} declarations spoken.`}
        >
          <defs>
            <radialGradient id="glow">
              <stop offset="0%" stopColor="#9bbf9e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#9bbf9e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* hyphae — the connecting vine */}
          <path d={path} fill="none" stroke="#c5d9c6" strokeWidth="3" strokeLinecap="round" />
          <path
            d={path}
            fill="none"
            stroke="#4c8352"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="6 10"
            strokeDashoffset={-phase * 32}
            opacity="0.6"
          />

          {nodes.map((n) => {
            const r = n.row
            if (!r) {
              return <circle key={n.iso} cx={n.x} cy={n.y} r="3" fill="#c5d9c6" opacity="0.6" />
            }
            const size = 3.5 + (r.barc_pulse || 3) * 0.8
            return (
              <g key={n.iso}>
                {r.moved_body && (
                  <circle cx={n.x} cy={n.y} r={size * 2.4 * breathe} fill="url(#glow)" />
                )}
                <circle cx={n.x} cy={n.y} r={size} fill="#3a6940" />
                {r.declaration && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={size + 3.5}
                    fill="none"
                    stroke="#d4a017"
                    strokeWidth="2.5"
                  />
                )}
                <title>
                  {`${n.iso}: pulse ${r.barc_pulse ?? '—'}${r.moved_body ? ', moved' : ''}${r.declaration ? ', declaration' : ''}`}
                </title>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card">
          <p className="text-3xl font-bold text-grace-700">{checkedDays}</p>
          <p className="text-sm text-grace-600">days practiced</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-gold-500">{declarations}</p>
          <p className="text-sm text-grace-600">declarations</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-grace-700">{avgPulse ? avgPulse.toFixed(1) : '—'}</p>
          <p className="text-sm text-grace-600">avg pulse</p>
        </div>
      </div>
    </div>
  )
}
