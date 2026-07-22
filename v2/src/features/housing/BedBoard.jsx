import { useEffect, useState } from 'react'
import { BedDouble, CalendarClock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const NEXT_STATUS = {
  available: 'held',
  held: 'occupied',
  occupied: 'maintenance',
  maintenance: 'available',
}

const statusStyle = {
  available: 'bg-grace-100 text-grace-800 border-grace-300',
  held: 'bg-gold-400/30 text-night-800 border-gold-400',
  occupied: 'bg-night-800 text-white border-night-800',
  maintenance: 'bg-grace-50 text-grace-400 border-grace-200',
}

/**
 * BedBoard — live occupancy for housing staff. Realtime subscription keeps
 * every open board in sync: mark a bed occupied here and the public
 * availability count updates everywhere instantly.
 */
export default function BedBoard({ profile }) {
  const [programs, setPrograms] = useState([])
  const [beds, setBeds] = useState([])
  const [apps, setApps] = useState([])

  async function load() {
    const [p, b, a] = await Promise.all([
      supabase.from('v2_housing_programs').select('*').order('name'),
      supabase.from('v2_housing_beds').select('*').order('label'),
      supabase
        .from('v2_housing_applications')
        .select('*, program:v2_housing_programs(name), applicant:v2_profiles!v2_housing_applications_applicant_id_fkey(display_name)')
        .in('status', ['submitted', 'under_review', 'intake_scheduled'])
        .order('submitted_at', { ascending: true }),
    ])
    setPrograms(p.data || [])
    setBeds(b.data || [])
    setApps(a.data || [])
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('v2-bed-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_housing_beds' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_housing_applications' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function cycleBed(bed) {
    const status = NEXT_STATUS[bed.status]
    await supabase
      .from('v2_housing_beds')
      .update({ status, ...(status === 'available' ? { resident_id: null } : {}) })
      .eq('id', bed.id)
    // realtime event refreshes state for us and every other open board
  }

  async function scheduleIntake(app) {
    const when = window.prompt('Intake date & time (e.g. 2026-07-25 14:00)')
    if (!when) return
    const iso = new Date(when).toISOString()
    await supabase
      .from('v2_housing_applications')
      .update({ status: 'intake_scheduled', intake_at: iso })
      .eq('id', app.id)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-grace-800">Bed board</h1>

      {programs.map((p) => {
        const programBeds = beds.filter((b) => b.program_id === p.id)
        const open = programBeds.filter((b) => b.status === 'available').length
        return (
          <section key={p.id} aria-labelledby={`prog-${p.id}`} className="card">
            <h2 id={`prog-${p.id}`} className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <BedDouble className="h-5 w-5 text-grace-600" aria-hidden />
              {p.name}
              <span className="text-sm font-normal text-grace-600">
                {open} of {programBeds.length} open
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {programBeds.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => cycleBed(b)}
                  className={`min-h-touch rounded-xl border-2 p-3 text-left font-semibold ${statusStyle[b.status]}`}
                  title="Tap to change status"
                >
                  {b.label}
                  <span className="block text-xs font-normal capitalize opacity-80">{b.status}</span>
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <section aria-labelledby="pipeline-heading" className="space-y-3">
        <h2 id="pipeline-heading" className="text-lg font-semibold text-night-900">
          Application pipeline ({apps.length})
        </h2>
        {apps.length === 0 && <p className="card text-grace-600">No pending applications.</p>}
        {apps.map((a) => (
          <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{a.applicant?.display_name || a.answers?.full_name || 'Applicant'}</p>
              <p className="text-sm text-grace-600">
                {a.program?.name} · {a.status.replace('_', ' ')}
                {a.intake_at && ` · intake ${new Date(a.intake_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`}
              </p>
            </div>
            <div className="flex gap-2">
              {a.status !== 'intake_scheduled' && (
                <button type="button" className="btn-secondary" onClick={() => scheduleIntake(a)}>
                  <CalendarClock className="h-5 w-5" aria-hidden /> Schedule intake
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  supabase.from('v2_housing_applications').update({ status: 'accepted' }).eq('id', a.id)
                }
              >
                Accept
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
