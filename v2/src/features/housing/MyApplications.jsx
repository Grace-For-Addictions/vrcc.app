import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const statusCopy = {
  draft: 'Draft',
  submitted: 'Submitted — the team has been notified',
  under_review: 'Under review',
  intake_scheduled: 'Intake scheduled',
  accepted: 'Accepted 🎉',
  waitlisted: 'Waitlisted',
  declined: 'Not this time',
  withdrawn: 'Withdrawn',
}

export default function MyApplications({ profile }) {
  const [apps, setApps] = useState([])
  const { state } = useLocation()

  useEffect(() => {
    supabase
      .from('v2_housing_applications')
      .select('*, program:v2_housing_programs(name, county)')
      .eq('applicant_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setApps(data || []))
  }, [profile.id])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-grace-800">Your applications</h1>
      {state?.notice && (
        <p className="rounded-xl bg-grace-100 p-3 text-grace-800" role="status">{state.notice}</p>
      )}
      {apps.length === 0 && (
        <p className="card text-grace-600">No applications yet. Browse housing to get started.</p>
      )}
      {apps.map((a) => (
        <div key={a.id} className="card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-night-900">{a.program?.name}</p>
              <p className="text-sm text-grace-600">{a.program?.county} County</p>
            </div>
            <span className="rounded-full bg-grace-100 px-3 py-1 text-sm font-semibold text-grace-800">
              {statusCopy[a.status] || a.status}
            </span>
          </div>
          {a.intake_at && (
            <p className="mt-2 text-grace-700">
              Virtual intake: {new Date(a.intake_at).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          )}
          {a.submitted_at && (
            <p className="mt-1 text-sm text-grace-500">
              Submitted {new Date(a.submitted_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
