import { useEffect, useState } from 'react'
import { Check, Clock3, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function CoachQueue({ profile }) {
  const [requests, setRequests] = useState([])
  const [suggesting, setSuggesting] = useState(null) // request id being counter-offered
  const [suggestTimes, setSuggestTimes] = useState(['', ''])

  async function load() {
    const { data } = await supabase
      .from('v2_session_requests')
      .select('*, participant:v2_profiles!v2_session_requests_participant_id_fkey(display_name)')
      .in('status', ['requested', 'times_suggested', 'accepted'])
      .order('created_at', { ascending: true })
    setRequests(data || [])
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('v2-coach-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_session_requests' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function accept(req, time) {
    const scheduledAt = time || req.preferred_times?.[0] || null
    await supabase
      .from('v2_session_requests')
      .update({ coach_id: profile.id, status: 'accepted', scheduled_at: scheduledAt })
      .eq('id', req.id)
    if (req.mode === 'video') {
      // Fire-and-forget: the edge function writes meeting_url onto the row.
      supabase.functions.invoke('create-meeting', {
        body: { session_id: req.id, topic: req.topic, scheduled_at: scheduledAt },
      })
    }
    load()
  }

  async function suggest(req) {
    await supabase
      .from('v2_session_requests')
      .update({
        coach_id: profile.id,
        status: 'times_suggested',
        suggested_times: suggestTimes.filter(Boolean),
      })
      .eq('id', req.id)
    setSuggesting(null)
    setSuggestTimes(['', ''])
    load()
  }

  async function passBack(req) {
    await supabase
      .from('v2_session_requests')
      .update({ coach_id: null, status: 'requested', suggested_times: [] })
      .eq('id', req.id)
    load()
  }

  async function complete(req) {
    await supabase.from('v2_session_requests').update({ status: 'completed' }).eq('id', req.id)
    load()
  }

  const pool = requests.filter((r) => r.status === 'requested' && !r.coach_id)
  const mine = requests.filter((r) => r.coach_id === profile.id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-grace-800">Coach queue</h1>

      <section aria-labelledby="pool-heading">
        <h2 id="pool-heading" className="mb-2 font-semibold text-night-900">
          Open pool ({pool.length})
        </h2>
        {pool.length === 0 && <p className="card text-grace-600">The pool is clear. 🎉</p>}
        {pool.map((r) => (
          <div key={r.id} className="card mb-3 space-y-3">
            <div>
              <p className="font-semibold">{r.participant?.display_name || 'Participant'} · {r.mode}</p>
              <p className="text-grace-700">{r.topic}</p>
              {r.preferred_times?.length > 0 && (
                <p className="text-sm text-grace-500">
                  Offered: {r.preferred_times.map((t) => new Date(t).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => accept(r)}>
                <Check className="h-5 w-5" aria-hidden /> Accept
              </button>
              <button type="button" className="btn-secondary" onClick={() => setSuggesting(r.id)}>
                <Clock3 className="h-5 w-5" aria-hidden /> Suggest times
              </button>
            </div>
            {suggesting === r.id && (
              <div className="space-y-2 rounded-xl bg-grace-50 p-3">
                {suggestTimes.map((t, i) => (
                  <input
                    key={i}
                    type="datetime-local"
                    className="field"
                    value={t}
                    aria-label={`Suggested time ${i + 1}`}
                    onChange={(e) => setSuggestTimes(suggestTimes.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                ))}
                <button type="button" className="btn-primary" onClick={() => suggest(r)}>
                  Send suggestions
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      <section aria-labelledby="mine-heading">
        <h2 id="mine-heading" className="mb-2 font-semibold text-night-900">
          Yours ({mine.length})
        </h2>
        {mine.map((r) => (
          <div key={r.id} className="card mb-3 space-y-3">
            <div>
              <p className="font-semibold">
                {r.participant?.display_name || 'Participant'} · {r.status.replace('_', ' ')}
              </p>
              <p className="text-grace-700">{r.topic}</p>
              {r.scheduled_at && (
                <p className="text-sm text-grace-500">
                  {new Date(r.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {r.meeting_url && (
                <a href={r.meeting_url} target="_blank" rel="noreferrer" className="btn-primary">Join</a>
              )}
              {r.status === 'accepted' && (
                <button type="button" className="btn-secondary" onClick={() => complete(r)}>
                  Mark completed
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={() => passBack(r)}>
                <Undo2 className="h-5 w-5" aria-hidden /> Back to pool
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
