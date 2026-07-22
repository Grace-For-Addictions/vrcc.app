import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Video, CalendarPlus, MessageSquareHeart } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const statusLabel = {
  requested: 'Waiting for a coach',
  accepted: 'Confirmed',
  times_suggested: 'New times suggested',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function googleCalendarUrl(session) {
  if (!session.scheduled_at) return null
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + 50 * 60 * 1000)
  const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'VRCC Coaching Session',
    dates: `${fmt(start)}/${fmt(end)}`,
    details: session.meeting_url ? `Join: ${session.meeting_url}` : 'VRCC recovery coaching session',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export default function SessionList({ profile }) {
  const [sessions, setSessions] = useState([])
  const { state } = useLocation()

  useEffect(() => {
    supabase
      .from('v2_session_requests')
      .select('*')
      .eq('participant_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSessions(data || []))
  }, [profile.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-grace-800">Your sessions</h1>
        <Link to="/sessions/request" className="btn-primary">New request</Link>
      </div>

      {state?.notice && (
        <p className="rounded-xl bg-grace-100 p-3 text-grace-800" role="status">{state.notice}</p>
      )}

      {sessions.length === 0 && (
        <p className="card text-grace-600">
          No sessions yet. Request one — a coach will pick it up, usually the same day.
        </p>
      )}

      {sessions.map((s) => (
        <div key={s.id} className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-night-900">{s.topic}</p>
              <p className="text-sm text-grace-600">
                {statusLabel[s.status]}
                {s.scheduled_at && ` · ${new Date(s.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              s.status === 'accepted' ? 'bg-grace-100 text-grace-800'
                : s.status === 'times_suggested' ? 'bg-gold-400/30 text-night-800'
                : 'bg-grace-50 text-grace-600'
            }`}>
              {statusLabel[s.status]}
            </span>
          </div>

          {s.status === 'times_suggested' && s.suggested_times?.length > 0 && (
            <div className="rounded-xl bg-grace-50 p-3">
              <p className="mb-2 text-sm font-semibold">Your coach suggested:</p>
              {s.suggested_times.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="btn-secondary mb-2 mr-2"
                  onClick={async () => {
                    await supabase
                      .from('v2_session_requests')
                      .update({ status: 'accepted', scheduled_at: t })
                      .eq('id', s.id)
                    setSessions((prev) =>
                      prev.map((x) => (x.id === s.id ? { ...x, status: 'accepted', scheduled_at: t } : x))
                    )
                  }}
                >
                  {new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {s.meeting_url && s.status === 'accepted' && (
              <a href={s.meeting_url} target="_blank" rel="noreferrer" className="btn-primary">
                <Video className="h-5 w-5" aria-hidden /> Join
              </a>
            )}
            {s.status === 'accepted' && s.scheduled_at && (
              <a href={googleCalendarUrl(s)} target="_blank" rel="noreferrer" className="btn-secondary">
                <CalendarPlus className="h-5 w-5" aria-hidden /> Add to calendar
              </a>
            )}
            {s.status === 'completed' && (
              <Link to={`/sessions/${s.id}/feedback`} className="btn-secondary">
                <MessageSquareHeart className="h-5 w-5" aria-hidden /> Leave feedback
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
