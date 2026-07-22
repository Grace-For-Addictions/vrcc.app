import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Mic, Square } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resilientWrite, newClientRef } from '../../lib/syncQueue'
import { useDraft } from '../../hooks/useDraft'
import { useVoiceInput } from '../../hooks/useVoiceInput'

/**
 * Six-step housing application. Every keystroke auto-saves to a local draft
 * (rural connections drop; applicants should never re-type), long answers can
 * be spoken instead of typed, and the final step offers virtual intake slots.
 */
const STEPS = [
  {
    title: 'About you',
    fields: [
      { key: 'full_name', label: 'Full name', type: 'text', required: true },
      { key: 'date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { key: 'phone', label: 'Best phone number', type: 'tel', required: true },
      { key: 'current_county', label: 'County you\'re in now', type: 'text', required: true },
    ],
  },
  {
    title: 'Your recovery',
    voice: true,
    fields: [
      { key: 'sobriety_date', label: 'Sobriety date (best estimate is fine)', type: 'date' },
      { key: 'recovery_story', label: 'Tell us a little about where you are in recovery', type: 'textarea', required: true },
      { key: 'in_treatment', label: 'Are you currently in treatment or on MAT?', type: 'select', options: ['No', 'Yes — outpatient', 'Yes — MAT', 'Yes — both'] },
    ],
  },
  {
    title: 'Safety & needs',
    fields: [
      { key: 'safe_now', label: 'Are you safe where you\'re staying tonight?', type: 'select', options: ['Yes', 'No', 'Not sure'], required: true },
      { key: 'medical_needs', label: 'Any medical needs we should plan for?', type: 'textarea' },
      { key: 'mobility_needs', label: 'Any accessibility or mobility needs?', type: 'textarea' },
    ],
  },
  {
    title: 'Work & income',
    fields: [
      { key: 'employment', label: 'Work situation', type: 'select', options: ['Employed', 'Looking', 'In school/training', 'Disability', 'Other'] },
      { key: 'income_notes', label: 'Anything about income or program fees we should know?', type: 'textarea' },
    ],
  },
  {
    title: 'Support circle',
    voice: true,
    fields: [
      { key: 'emergency_contact', label: 'Emergency contact (name + phone)', type: 'text', required: true },
      { key: 'support_people', label: 'Who\'s in your corner? (sponsor, coach, family, church…)', type: 'textarea' },
    ],
  },
  {
    title: 'Virtual intake',
    fields: [
      { key: 'intake_preference', label: 'How would you like to do your intake conversation?', type: 'select', options: ['Video call', 'Phone call', 'In person'], required: true },
      { key: 'intake_times', label: 'Days/times that usually work for you', type: 'textarea', required: true },
    ],
  },
]

export default function ApplicationWizard({ profile }) {
  const { id: programId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [step, setStep] = useState(0)
  const [answers, setAnswers, clearDraft] = useDraft(`housing-app-${programId}`, {})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [voiceTarget, setVoiceTarget] = useState(null)
  const voice = useVoiceInput({
    onTranscript: (text) => {
      if (!voiceTarget) return
      setAnswers((a) => ({ ...a, [voiceTarget]: a[voiceTarget] ? `${a[voiceTarget]} ${text}` : text }))
    },
  })

  const rulesAgreedAt = state?.rulesAgreedAt || answers.__rules_agreed_at
  if (state?.rulesAgreedAt && !answers.__rules_agreed_at) {
    // Persist the acknowledgement into the draft so a page refresh keeps it.
    setAnswers((a) => ({ ...a, __rules_agreed_at: state.rulesAgreedAt }))
  }

  const current = STEPS[step]
  const stepValid = current.fields.every((f) => !f.required || (answers[f.key] || '').trim())

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      if (!rulesAgreedAt) throw new Error('Please review the house rules first.')
      const { __rules_agreed_at, ...payloadAnswers } = answers
      const { queued } = await resilientWrite(supabase, {
        table: 'v2_housing_applications',
        op: 'insert',
        payload: {
          program_id: programId,
          applicant_id: profile.id,
          status: 'submitted',
          rules_agreed_at: rulesAgreedAt,
          answers: payloadAnswers,
          current_step: 6,
          client_ref: newClientRef(),
        },
      })
      clearDraft()
      navigate('/housing/applications', {
        state: {
          notice: queued
            ? 'Application saved offline — it submits the moment you reconnect.'
            : 'Application submitted! The house team and your navigator have been notified.',
        },
      })
    } catch (err) {
      setError(err.message || 'Could not submit — your draft is safe on this device.')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-grace-500">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="text-2xl font-bold text-grace-800">{current.title}</h1>
        <div className="mt-2 flex gap-1" aria-hidden>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-grace-600' : 'bg-grace-200'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-grace-600" role="status">
          Auto-saving as you go — you can close this and pick up where you left off.
        </p>
      </div>

      {current.fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className="mb-1 block font-semibold text-night-900">
            {f.label}
            {f.required && <span className="text-red-700"> *</span>}
          </label>
          {f.type === 'textarea' ? (
            <>
              <textarea
                id={f.key}
                className="field min-h-[88px]"
                value={answers[f.key] || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
              />
              {current.voice && voice.supported && (
                <button
                  type="button"
                  className={voice.recording && voiceTarget === f.key ? 'btn-gold mt-2' : 'btn-secondary mt-2'}
                  onClick={() => {
                    if (voice.recording) {
                      voice.stop()
                      setVoiceTarget(null)
                    } else {
                      setVoiceTarget(f.key)
                      voice.start()
                    }
                  }}
                >
                  {voice.recording && voiceTarget === f.key ? (
                    <><Square className="h-5 w-5" aria-hidden /> Stop</>
                  ) : (
                    <><Mic className="h-5 w-5" aria-hidden /> Speak your answer</>
                  )}
                </button>
              )}
            </>
          ) : f.type === 'select' ? (
            <select
              id={f.key}
              className="field"
              value={answers[f.key] || ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
            >
              <option value="">Choose…</option>
              {f.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              id={f.key}
              type={f.type}
              className="field"
              value={answers[f.key] || ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" className="btn-secondary flex-1" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={!stepValid}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={!stepValid || submitting}
            onClick={submit}
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        )}
      </div>
    </div>
  )
}
