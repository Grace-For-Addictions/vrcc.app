// src/components/checkins/EveningReflection.jsx
// Evening Reflection: GROW walk-through + BARC pulse + gratitude + declaration.
// The declaration is the observer-effect moment — spoken futures begin to entangle.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useCheckinStore } from '../../stores/useCheckinStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { VoiceTextField } from '../shared/VoiceTextField';

const GROW_STEPS = [
  { key: 'grow_goal',    label: 'Goal',    prompt: 'What mattered most today?' },
  { key: 'grow_reality', label: 'Reality', prompt: 'What actually happened — honestly, gently?' },
  { key: 'grow_options', label: 'Options', prompt: 'What could tomorrow hold? Any option counts.' },
  { key: 'grow_will',    label: 'Will',    prompt: 'What one small thing WILL you do?' },
];

export default function EveningReflection({ onSaved }) {
  const { collapse, reduced } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const { today, saveCheckin } = useCheckinStore();

  const [grow, setGrow] = useState({ grow_goal: '', grow_reality: '', grow_options: '', grow_will: '' });
  const [barc, setBarc] = useState(0);
  const [gratitude, setGratitude] = useState('');
  const [declaration, setDeclaration] = useState('');
  const [coachVisible, setCoachVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  if (today.evening) {
    return (
      <motion.div {...collapse} className="rounded-3xl bg-moss-900/60 border border-spore-500/30 p-6" role="status">
        <p className="font-display text-xl text-spore-100">Tonight's reflection is complete 🌙</p>
        {today.evening.declaration && <p className="mt-2 text-moss-100 italic">Declared: “{today.evening.declaration}”</p>}
      </motion.div>
    );
  }

  const save = async () => {
    setSaving(true);
    await saveCheckin({
      user_id: profile.id, kind: 'evening',
      checkin_date: new Date().toISOString().slice(0, 10),
      ...Object.fromEntries(Object.entries(grow).map(([k, v]) => [k, v || null])),
      barc_pulse: barc || null,
      gratitude: gratitude || null,
      declaration: declaration || null,
      coach_visible: coachVisible,
    });
    setSaving(false); onSaved?.();
  };

  return (
    <motion.section {...collapse} aria-labelledby="evening-h" className="space-y-6">
      <h2 id="evening-h" className="font-display text-2xl text-spore-100">Evening Reflection</h2>

      {GROW_STEPS.map((s, i) => (
        <VoiceTextField key={s.key} id={s.key} rows={2}
          label={<><span className="text-spore-300 font-bold">{s.label[0]}</span>{s.label.slice(1)} · {s.prompt}</>}
          value={grow[s.key]}
          onChange={(v) => setGrow((g) => ({ ...g, [s.key]: v }))}
          placeholder="Type or speak…" />
      ))}

      <fieldset>
        <legend className="text-moss-200 mb-2">Quick BARC pulse — how full is your recovery-capital tank tonight?</legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Recovery capital pulse, 1 to 6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} role="radio" aria-checked={barc === n} onClick={() => setBarc(n)}
              className={`h-12 w-12 rounded-full border focus-visible:ring-4 ring-spore-400/60
                ${barc >= n ? 'border-spore-400 bg-spore-500/25 text-spore-50' : 'border-moss-700 text-moss-400'}`}>
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-moss-400 mt-1">1 = running on empty · 6 = deeply resourced. No wrong answers.</p>
      </fieldset>

      <VoiceTextField id="gratitude" rows={2} value={gratitude} onChange={setGratitude}
        label="One gratitude, however small" placeholder="Tonight I'm grateful for…" />

      <div className="rounded-2xl border border-spore-500/30 bg-spore-500/5 p-4">
        <VoiceTextField id="declaration" rows={2} value={declaration} onChange={setDeclaration}
          label={<span className="text-spore-200">✦ Tonight's declaration — speak your future into the field</span>}
          placeholder="I am becoming…" />
      </div>

      <label className="flex items-start gap-3 min-h-[48px] text-moss-200 text-sm">
        <input type="checkbox" checked={coachVisible} onChange={(e) => setCoachVisible(e.target.checked)}
          className="h-6 w-6 rounded accent-spore-500 mt-0.5" />
        <span>Share tonight's reflection with my coach. <strong className="text-moss-100">Private by default.</strong></span>
      </label>

      <motion.button whileTap={reduced ? undefined : { scale: 0.98 }} onClick={save} disabled={saving}
        className="w-full min-h-[56px] rounded-2xl bg-spore-500 text-moss-950 font-semibold text-lg shadow-glow disabled:opacity-40">
        {saving ? 'Sealing the day…' : "Complete tonight's reflection"}
      </motion.button>
    </motion.section>
  );
}
