import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Square, Sunrise } from 'lucide-react'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { loadToday, saveCheckin, uploadVoiceNote } from './checkinApi'

// BDNF prompts: small movement/nature/connection nudges. Naming the science
// ("this grows new brain cells") is intentional — it reframes recovery as
// physical healing, which lands well in coaching conversations.
const BDNF_PROMPTS = [
  'Take a 10-minute walk outside before noon — sunlight + movement raises BDNF, the protein your brain uses to grow new connections.',
  'Do 20 slow bodyweight squats. Brief intense movement is one of the fastest natural BDNF boosts.',
  'Step outside and name five things you can hear. Time in nature lowers stress hormones that block brain repair.',
  'Call or text one person who wants good things for you. Genuine connection is a measurable brain-growth signal.',
  'Dance to one full song. Novel movement patterns build new neural pathways faster than routine ones.',
  'Climb stairs or a hill until your heart works. Your brain repairs itself fastest in the hour after.',
  'Stretch for five slow minutes and breathe out longer than you breathe in. Calm is a growth state.',
]

export default function MorningIntentions({ profile }) {
  const navigate = useNavigate()
  const [intention, setIntention] = useState('')
  const [saved, setSaved] = useState(false)
  const [queuedNote, setQueuedNote] = useState(false)
  const voice = useVoiceInput({
    onTranscript: (text) => setIntention((prev) => (prev ? `${prev} ${text}` : text)),
  })

  // Deterministic prompt per day so morning revisits show the same nudge.
  const prompt = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86_400_000)
    return BDNF_PROMPTS[dayIndex % BDNF_PROMPTS.length]
  }, [])

  useEffect(() => {
    loadToday(profile.id).then((row) => {
      if (row?.intention) {
        setIntention(row.intention)
        setSaved(true)
      }
    })
  }, [profile.id])

  async function submit(e) {
    e.preventDefault()
    const voicePath = await uploadVoiceNote(profile.id, voice.blob, 'morning')
    const { queued } = await saveCheckin(profile.id, {
      intention,
      bdnf_prompt: prompt,
      ...(voicePath ? { morning_voice_path: voicePath } : {}),
    })
    setQueuedNote(queued)
    setSaved(true)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3">
        <Sunrise className="h-8 w-8 text-gold-500" aria-hidden />
        <h1 className="text-2xl font-bold text-grace-800">Morning intentions</h1>
      </div>

      <div className="card border-l-4 border-l-gold-500 bg-gold-400/10">
        <p className="text-sm font-semibold uppercase tracking-wide text-grace-700">
          Today's brain-growth practice
        </p>
        <p className="mt-1 text-night-900">{prompt}</p>
      </div>

      <div>
        <label htmlFor="intention" className="mb-1 block font-semibold text-night-900">
          What's your intention for today?
        </label>
        <textarea
          id="intention"
          className="field min-h-[110px]"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="Type it, or press the mic and just say it out loud."
        />
        {voice.supported && (
          <button
            type="button"
            onClick={voice.recording ? voice.stop : voice.start}
            className={voice.recording ? 'btn-gold mt-2' : 'btn-secondary mt-2'}
            aria-pressed={voice.recording}
          >
            {voice.recording ? (
              <><Square className="h-5 w-5" aria-hidden /> Stop recording</>
            ) : (
              <><Mic className="h-5 w-5" aria-hidden /> Speak instead</>
            )}
          </button>
        )}
        {voice.blob && !voice.recording && (
          <p className="mt-2 text-sm text-grace-600" role="status">
            Voice note captured — it saves with your intention.
          </p>
        )}
        {voice.error && <p className="mt-2 text-sm text-red-700">{voice.error}</p>}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={!intention && !voice.blob}>
        {saved ? 'Update intention' : 'Set my intention'}
      </button>

      {saved && (
        <p className="rounded-xl bg-grace-100 p-3 text-grace-800" role="status">
          {queuedNote
            ? 'Saved on your device — it syncs the moment you reconnect.'
            : 'Intention set. See you tonight for your reflection.'}{' '}
          <button type="button" className="font-semibold underline" onClick={() => navigate('/daily/trends')}>
            View your growth map
          </button>
        </p>
      )}
    </form>
  )
}
