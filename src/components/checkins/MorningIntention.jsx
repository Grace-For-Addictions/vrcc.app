// src/components/checkins/MorningIntention.jsx
// Morning Intentions: text/voice intention + optional BDNF movement prompt.
// Setting an intention = a quantum declaration: the observed day begins to take shape.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useCheckinStore } from '../../stores/useCheckinStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { VoiceTextField } from '../shared/VoiceTextField';
import { recordVoiceNote } from '../../lib/voice';

const BDNF_PROMPTS = [
  'A 10-minute walk — even to the mailbox and back. Movement feeds the brain (BDNF).',
  '20 slow bodyweight squats while the coffee brews.',
  'Stretch tall, breathe deep, 5 sun reaches. Your neurons are listening.',
  'Dance to one full song. Seriously — one song.',
  'Carry something (groceries, firewood, a grandkid). Strength is neuroplasticity.',
];

export default function MorningIntention({ onSaved }) {
  const { collapse, reduced } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const { today, saveCheckin, uploadVoiceNote } = useCheckinStore();

  const prompt = useMemo(() => BDNF_PROMPTS[new Date().getDate() % BDNF_PROMPTS.length], []);
  const [intention, setIntention] = useState('');
  const [movementDone, setMovementDone] = useState(false);
  const [coachVisible, setCoachVisible] = useState(false);
  const [rec, setRec] = useState(null);           // active recorder
  const [audioBlob, setAudioBlob] = useState(null);
  const [saving, setSaving] = useState(false);

  if (today.morning) {
    return (
      <motion.div {...collapse} className="rounded-3xl bg-moss-900/60 border border-spore-500/30 p-6" role="status">
        <p className="font-display text-xl text-spore-100">Today's intention is planted 🌅</p>
        {today.morning.intention_text && <p className="mt-2 text-moss-100 italic">“{today.morning.intention_text}”</p>}
        {today.morning._local && <p className="mt-2 text-sm text-lichen-200">Saved on this device — will sync when you're back online.</p>}
      </motion.div>
    );
  }

  const toggleRecord = async () => {
    if (rec) { setAudioBlob(await rec.stop()); setRec(null); return; }
    try { setRec(await recordVoiceNote()); } catch { /* mic denied — text still works */ }
  };

  const save = async () => {
    setSaving(true);
    let audioUrl = null;
    if (audioBlob && navigator.onLine) audioUrl = await uploadVoiceNote(profile.id, audioBlob);
    await saveCheckin({
      user_id: profile.id, kind: 'morning',
      checkin_date: new Date().toISOString().slice(0, 10),
      intention_text: intention || null,
      intention_audio_url: audioUrl,
      movement_prompt: prompt, movement_done: movementDone,
      coach_visible: coachVisible,
    });
    setSaving(false); onSaved?.();
  };

  return (
    <motion.section {...collapse} aria-labelledby="morning-h" className="space-y-6">
      <h2 id="morning-h" className="font-display text-2xl text-spore-100">Morning Intention</h2>

      <VoiceTextField
        id="intention" value={intention} onChange={setIntention} rows={3}
        label="What is one true thing you intend for today?"
        placeholder="Today I will… (type or speak)" />

      <div className="flex items-center gap-3">
        <button type="button" onClick={toggleRecord}
          className={`min-h-[48px] px-4 rounded-full border ${rec ? 'border-amber-400 text-amber-200 animate-pulse motion-reduce:animate-none' : 'border-moss-600 text-moss-200'}`}>
          {rec ? '■ Stop recording' : audioBlob ? '↺ Re-record voice note' : '● Record a voice note instead'}
        </button>
        {audioBlob && <span className="text-sm text-spore-200">Voice note ready ✓</span>}
      </div>

      <div className="rounded-2xl border border-lichen-500/30 bg-lichen-500/10 p-4">
        <p className="text-lichen-100 font-medium">Today's BDNF movement 🌿</p>
        <p className="text-moss-200 mt-1">{prompt}</p>
        <label className="mt-3 flex items-center gap-3 min-h-[48px] text-moss-100">
          <input type="checkbox" checked={movementDone} onChange={(e) => setMovementDone(e.target.checked)}
            className="h-6 w-6 rounded accent-lichen-400" />
          I'll do this (or already did!)
        </label>
      </div>

      <label className="flex items-start gap-3 min-h-[48px] text-moss-200 text-sm">
        <input type="checkbox" checked={coachVisible} onChange={(e) => setCoachVisible(e.target.checked)}
          className="h-6 w-6 rounded accent-spore-500 mt-0.5" />
        <span>Share today's check-in with my coach. <strong className="text-moss-100">Private by default</strong> — you choose, every single day.</span>
      </label>

      <motion.button whileTap={reduced ? undefined : { scale: 0.98 }} onClick={save}
        disabled={saving || (!intention && !audioBlob)}
        className="w-full min-h-[56px] rounded-2xl bg-spore-500 text-moss-950 font-semibold text-lg shadow-glow disabled:opacity-40">
        {saving ? 'Planting…' : "Plant today's intention"}
      </motion.button>
    </motion.section>
  );
}
