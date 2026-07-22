import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BedDouble, ScrollText } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * Rules-before-apply: the Apply button stays disabled until the applicant has
 * scrolled/opened the full house rules and checked the acknowledgement. The
 * agreement timestamp travels into the application (enforced again by a DB
 * check constraint at submit).
 */
export default function ProgramDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    supabase.from('v2_housing_programs').select('*').eq('id', id).single()
      .then(({ data }) => setProgram(data))
    supabase.from('v2_bed_availability').select('*').eq('program_id', id).single()
      .then(({ data }) => setAvailability(data))
  }, [id])

  if (!program) return <p className="text-grace-600">Loading…</p>

  const rules = Array.isArray(program.rules) ? program.rules : []

  return (
    <div className="space-y-5">
      <Link to="/housing" className="text-sm font-medium text-grace-600 underline">
        ← Back to housing
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-grace-800">{program.name}</h1>
        <p className="text-grace-600">
          {program.county} County
          {availability && (
            <span className="ml-2 inline-flex items-center gap-1 font-semibold text-grace-800">
              <BedDouble className="h-4 w-4" aria-hidden />
              {availability.available_beds} of {availability.total_beds} beds open
            </span>
          )}
        </p>
      </div>
      <p className="text-grace-700">{program.description}</p>

      <section aria-labelledby="rules-heading" className="card">
        <h2 id="rules-heading" className="mb-3 flex items-center gap-2 text-lg font-semibold text-night-900">
          <ScrollText className="h-5 w-5 text-grace-600" aria-hidden />
          House rules — read before you apply
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-grace-800">
          {rules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>
        <label className="mt-4 flex min-h-touch cursor-pointer items-start gap-3 rounded-xl bg-grace-50 p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-6 w-6 accent-grace-600"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I've read all {rules.length} house rules and I'm willing to live by them.
            <span className="block text-sm text-grace-600">
              Knowing the expectations up front protects your placement — and everyone else's.
            </span>
          </span>
        </label>
      </section>

      <button
        type="button"
        className="btn-primary w-full"
        disabled={!agreed || !program.accepting}
        onClick={() =>
          navigate(`/housing/programs/${id}/apply`, {
            state: { rulesAgreedAt: new Date().toISOString() },
          })
        }
      >
        {program.accepting ? 'Start application' : 'Not accepting right now'}
      </button>
      {!agreed && program.accepting && (
        <p className="text-center text-sm text-grace-500">
          The button unlocks once you've acknowledged the rules above.
        </p>
      )}
    </div>
  )
}
