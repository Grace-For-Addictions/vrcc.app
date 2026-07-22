import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, Phone, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resilientWrite, newClientRef } from '../../lib/syncQueue'

const modes = [
  { value: 'video', label: 'Video', icon: Video, hint: 'Zoom link created for you' },
  { value: 'phone', label: 'Phone', icon: Phone, hint: 'Works on any connection' },
  { value: 'in_person', label: 'In person', icon: Users, hint: 'At the center' },
]

export default function RequestSession({ profile }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('video')
  const [topic, setTopic] = useState('')
  const [times, setTimes] = useState(['', '', ''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { queued } = await resilientWrite(supabase, {
        table: 'v2_session_requests',
        op: 'insert',
        payload: {
          participant_id: profile.id,
          mode,
          topic,
          preferred_times: times.filter(Boolean),
          client_ref: newClientRef(),
        },
      })
      navigate('/sessions', {
        state: {
          notice: queued
            ? 'Saved offline — your request will send as soon as you reconnect.'
            : 'Request sent. Your coach team has been notified.',
        },
      })
    } catch (err) {
      setError(err.message || 'Could not save your request.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-2xl font-bold text-grace-800">Request a session</h1>

      <fieldset>
        <legend className="mb-2 font-semibold text-night-900">How do you want to meet?</legend>
        <div className="grid grid-cols-3 gap-2">
          {modes.map(({ value, label, icon: Icon, hint }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`card flex min-h-touch flex-col items-center gap-1 p-3 text-center ${
                mode === value ? 'border-2 border-grace-500 bg-grace-50' : ''
              }`}
            >
              <Icon className="h-6 w-6 text-grace-600" aria-hidden />
              <span className="font-semibold">{label}</span>
              <span className="text-xs text-grace-500">{hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="topic" className="mb-1 block font-semibold text-night-900">
          What would you like to talk about?
        </label>
        <textarea
          id="topic"
          className="field min-h-[96px]"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          placeholder="Whatever's on your mind — cravings, housing, family, a win to celebrate…"
        />
      </div>

      <fieldset>
        <legend className="mb-1 font-semibold text-night-900">Times that work for you</legend>
        <p className="mb-2 text-sm text-grace-600">Offer up to three windows; your coach picks or suggests others.</p>
        <div className="space-y-2">
          {times.map((t, i) => (
            <input
              key={i}
              type="datetime-local"
              className="field"
              value={t}
              aria-label={`Preferred time ${i + 1}`}
              onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Sending…' : 'Send request'}
      </button>
    </form>
  )
}
