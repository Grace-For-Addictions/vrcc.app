import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resilientWrite, newClientRef } from '../../lib/syncQueue'

export default function SessionFeedback({ profile }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [whatHelped, setWhatHelped] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      await resilientWrite(supabase, {
        table: 'v2_session_feedback',
        op: 'insert',
        payload: {
          session_id: id,
          author_id: profile.id,
          rating: rating || null,
          what_helped: whatHelped || null,
          follow_up: followUp || null,
          client_ref: newClientRef(),
        },
      })
      navigate('/sessions', { state: { notice: 'Thanks — your feedback helps us grow.' } })
    } catch (err) {
      setError(err.message || 'Could not save feedback.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-2xl font-bold text-grace-800">How was your session?</h1>

      <fieldset>
        <legend className="mb-2 font-semibold text-night-900">Rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-pressed={rating >= n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="flex min-h-touch min-w-touch items-center justify-center"
            >
              <Star
                className={`h-8 w-8 ${rating >= n ? 'fill-gold-500 text-gold-500' : 'text-grace-300'}`}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="helped" className="mb-1 block font-semibold text-night-900">
          What helped most?
        </label>
        <textarea
          id="helped"
          className="field min-h-[80px]"
          value={whatHelped}
          onChange={(e) => setWhatHelped(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="followup" className="mb-1 block font-semibold text-night-900">
          Anything you'd like your coach to follow up on?
        </label>
        <textarea
          id="followup"
          className="field min-h-[80px]"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          placeholder="A resource, a referral, a question you didn't get to…"
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary w-full">Send feedback</button>
    </form>
  )
}
