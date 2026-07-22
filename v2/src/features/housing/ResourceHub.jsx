import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BedDouble, Video, MapPin, Phone, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const CATEGORIES = ['all', 'crisis', 'treatment', 'transport', 'food', 'legal']

export default function ResourceHub() {
  const [programs, setPrograms] = useState([])
  const [availability, setAvailability] = useState({})
  const [resources, setResources] = useState([])
  const [county, setCounty] = useState('all')
  const [telehealthOnly, setTelehealthOnly] = useState(false)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    supabase.from('v2_housing_programs').select('*').order('name')
      .then(({ data }) => setPrograms(data || []))
    supabase.from('v2_bed_availability').select('*')
      .then(({ data }) =>
        setAvailability(Object.fromEntries((data || []).map((a) => [a.program_id, a]))))
    supabase.from('v2_resources').select('*').order('title')
      .then(({ data }) => setResources(data || []))
  }, [])

  const counties = useMemo(() => {
    const set = new Set()
    programs.forEach((p) => set.add(p.county))
    resources.forEach((r) => (r.counties || []).forEach((c) => set.add(c)))
    return ['all', ...[...set].sort()]
  }, [programs, resources])

  const visiblePrograms = programs.filter(
    (p) =>
      (county === 'all' || p.county === county) &&
      (!telehealthOnly || p.telehealth_ok)
  )
  const visibleResources = resources.filter(
    (r) =>
      (category === 'all' || r.category === category) &&
      (county === 'all' || r.counties.length === 0 || r.counties.includes(county)) &&
      (!telehealthOnly || r.telehealth_ok)
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-grace-800">Housing &amp; resources</h1>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 font-medium" htmlFor="county">
            <MapPin className="h-5 w-5 text-grace-600" aria-hidden /> County
          </label>
          <select
            id="county"
            className="field max-w-xs"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          >
            {counties.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All counties' : c}</option>
            ))}
          </select>
        </div>
        <label className="flex min-h-touch cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-6 w-6 accent-grace-600"
            checked={telehealthOnly}
            onChange={(e) => setTelehealthOnly(e.target.checked)}
          />
          <span className="flex items-center gap-2">
            <Video className="h-5 w-5 text-grace-600" aria-hidden />
            Telehealth / virtual only
            <span className="text-sm text-grace-500">(no reliable ride? filter to what reaches you)</span>
          </span>
        </label>
      </div>

      <section aria-labelledby="housing-heading" className="space-y-3">
        <h2 id="housing-heading" className="text-lg font-semibold text-night-900">
          Recovery housing
        </h2>
        {visiblePrograms.length === 0 && (
          <p className="card text-grace-600">No programs match those filters yet.</p>
        )}
        {visiblePrograms.map((p) => {
          const a = availability[p.id]
          return (
            <Link key={p.id} to={`/housing/programs/${p.id}`} className="card block hover:border-grace-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-night-900">{p.name}</p>
                  <p className="text-sm text-grace-600">{p.county} County · {p.telehealth_ok ? 'Virtual intake available' : 'In-person intake'}</p>
                  <p className="mt-1 text-grace-700">{p.description}</p>
                </div>
                <span
                  className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${
                    a?.available_beds > 0 ? 'bg-grace-100 text-grace-800' : 'bg-grace-50 text-grace-500'
                  }`}
                >
                  <BedDouble className="h-4 w-4" aria-hidden />
                  {a ? `${a.available_beds}/${a.total_beds} open` : '—'}
                </span>
              </div>
            </Link>
          )
        })}
      </section>

      <section aria-labelledby="resources-heading" className="space-y-3">
        <h2 id="resources-heading" className="text-lg font-semibold text-night-900">
          Local help
        </h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`btn min-h-touch capitalize ${
                category === c ? 'bg-grace-600 text-white' : 'border-2 border-grace-200 bg-white text-grace-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {visibleResources.map((r) => (
          <div key={r.id} className="card">
            <p className="font-semibold text-night-900">{r.title}</p>
            <p className="text-sm capitalize text-grace-500">{r.category}{r.telehealth_ok ? ' · virtual' : ''}</p>
            <p className="mt-1 text-grace-700">{r.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.phone && (
                <a href={`tel:${r.phone}`} className="btn-secondary">
                  <Phone className="h-5 w-5" aria-hidden /> {r.phone}
                </a>
              )}
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className="btn-secondary">
                  <ExternalLink className="h-5 w-5" aria-hidden /> Website
                </a>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
