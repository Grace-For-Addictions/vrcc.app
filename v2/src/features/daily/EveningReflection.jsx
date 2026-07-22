import { useEffect, useState } from 'react'
import { MoonStar, Mic, Square } from 'lucide-react'
import { useDraft } from '../../hooks/useDraft'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { loadToday, saveCheckin, uploadVoiceNote, todayISO } from './checkinApi'

const GROW_FIELDS = [
  { key: 'grow_goal', label: 'Goal', prompt: 'What did you want from today?' },
  { key: 'grow_reality', label: 'Reality', prompt: 'What actually happened — the honest version?' },
  { key: 'grow_options', label: 'Options', prompt: 'What could you try differently tomorrow?' },
  { key: 'grow_way_forward', label: 'Way forward', prompt: 'What one thing will you actually do?' },
]

const emptyDraft = {
  grow_goal: '', grow_reality: '', grow_options: '', grow_way_forward: '',
  barc_pulse: 0, moved_body: false, declaration: false, shared_with_coach: false,
}

export default function EveningReflection({ profile }) {
  const [draft, setDraft, clearDraft] = useDraft(`evening-${todayISO()}`, emptyDraft)
  const [saved, setSaved] = useState(false)
  const [queuedNote, setQueuedNote] = useState(false)
  const voice = useVoiceInput({
    onTranscript: (text) =>
      setDraft((d) => ({ ...d, grow_reality: d.grow_reality ? `${d.grow_reality} ${text}` : text })),
  })

  useEffect(() => {
    loadToday(profile.id).then((row) => {
      if (row?.grow_way_forward || row?.barc_pulse) setSaved(true)
    })
  }, [profile.id])

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  async function submit(e) {
    e.preventDefault()
    const voicePath = await uploadVoiceNote(profile.id, voice.blob, 'evening')
    const { queued } = await saveCheckin(profile.id, {
      grow_goal: draft.grow_goal || null,
      grow_reality: draft.grow_reality || null,
      grow_options: draft.grow_options || null,
      grow_way_forward: draft.grow_way_forward || null,
      barc_pulse: draft.barc_pulse || null,
      moved_body: draft.moved_body,
      declaration: draft.declaration,
      shared_with_coach: draft.shared_with_coach,
      ...(voicePath ? { evening_voice_path: voicePath } : {}),
    })
    setQueuedNote(queued)
    setSaved(true)
    clearDraft()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3">
        <MoonStar className="h-8 w-8 text-grace-600" aria-hidden />
        <h1 className="text-2xl font-bold text-grace-800">Evening reflection</h1>
      </div>
      <p className="text-grace-600">
        Four short GROW questions, one pulse, one declaration. Your answers auto-save
        as you type — nothing is lost if your signal drops.
      </p>

      {GROW_FIELDS.map(({ key, label, prompt }) => (
        <div key={key}>
          <label htmlFor={key} className="mb-1 block font-semibold text-night-900">
            {label} <span className="font-normal text-grace-600">— {prompt}</span>
          </label>
          <textarea
            id={key}
            className="field min-h-[72px]"
            value={draft[key]}
            onChange={(e) => set(key, e.target.value)}
          />
          {key === 'grow_reality' && voice.supported && (
            <button
              type="button"
              onClick={voice.recording ? voice.stop : voice.start}
              className={voice.recording ? 'btn-gold mt-2' : 'btn-secondary mt-2'}
              aria-pressed={voice.recording}
            >
              {voice.recording ? (
                <><Square className="h-5 w-5" aria-hidden /> Stop</>
              ) : (
                <><Mic className="h-5 w-5" aria-hidden /> Say it instead</>
              )}
            </button>
          )}
        </div>
      ))}

      <fieldset>
        <legend className="mb-2 font-semibold text-night-900">
          Recovery pulse — how strong is your recovery capital today?
        </legend>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set('barc_pulse', n)}
              aria-pressed={draft.barc_pulse === n}
              className={`flex min-h-touch min-w-touch items-center justify-center rounded-xl border-2 font-bold ${
                draft.barc_pulse === n
                  ? 'border-grace-600 bg-grace-600 text-white'
                  : 'border-grace-200 bg-white text-grace-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="card flex min-h-touch cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="h-6 w-6 accent-grace-600"
          checked={draft.moved_body}
          onChange={(e) => set('moved_body', e.target.checked)}
        />
        <span>I moved my body today (today's brain-growth practice or any movement).</span>
      </label>

      <label className="card flex min-h-touch cursor-pointer items-center gap-3 border-gold-400">
        <input
          type="checkbox"
          className="h-6 w-6 accent-gold-500"
          checked={draft.declaration}
          onChange={(e) => set('declaration', e.target.checked)}
        />
        <span className="font-semibold">
          I said my declaration out loud: “I am rebuilding my life, and today counted.”
        </span>
      </label>

      <label className="card flex min-h-touch cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="h-6 w-6 accent-grace-600"
          checked={draft.shared_with_coach}
          onChange={(e) => set('shared_with_coach', e.target.checked)}
        />
        <span>
          Share today's reflection with my coach.
          <span className="block text-sm text-grace-600">
            Off by default. Your daily practice is private unless you choose to share each day.
          </span>
        </span>
      </label>

      <button type="submit" className="btn-primary w-full">
        {saved ? 'Update reflection' : 'Complete today'}
      </button>
      {saved && (
        <p className="rounded-xl bg-grace-100 p-3 text-grace-800" role="status">
          {queuedNote
            ? 'Saved on your device — it syncs when you reconnect.'
            : 'Reflection saved. Rest well.'}
        </p>
      )}
    </form>
  )
}
