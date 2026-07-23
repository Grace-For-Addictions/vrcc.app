// src/components/sessions/SessionRequestForm.jsx
// Participant requests a peer_support / recovery_coach / life_coach session.
// Declaration-style commit moment: submitting "collapses the waveform" gently.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { VoiceTextField } from '../shared/VoiceTextField';

const SESSION_TYPES = [
  { value: 'peer_support',   label: 'Peer Support',   sub: 'Someone who has walked this road' },
  { value: 'recovery_coach', label: 'Recovery Coach', sub: 'GROW goals & recovery capital' },
  { value: 'life_coach',     label: 'Life Coach',     sub: 'Work, purpose & everyday life' },
];

function nextSlots(count = 6) {
  // Suggest human-friendly starting points; participant can edit each one.
  const slots = [];
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  while (slots.length < count) {
    const h = d.getHours();
    if (h >= 9 && h <= 19) slots.push(new Date(d));
    d.setHours(d.getHours() + (h >= 19 ? 14 : 5));
  }
  return slots;
}

export default function SessionRequestForm({ onSubmitted }) {
  const { collapse, ripple, reduced } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const submitRequest = useSessionStore((s) => s.submitRequest);

  const [type, setType] = useState(null);
  const [topic, setTopic] = useState('');
  const [provider, setProvider] = useState('ooma');
  const [picked, setPicked] = useState([]);
  const [state, setState] = useState('idle'); // idle | saving | done | error
  const slots = nextSlots();

  const toggleSlot = (iso) =>
    setPicked((p) => (p.includes(iso) ? p.filter((x) => x !== iso) : [...p, iso]));

  const canSubmit = type && picked.length > 0 && state !== 'saving';

  const submit = async () => {
    setState('saving');
    const { error } = await submitRequest({
      participantId: profile.id,
      sessionType: type,
      topic: topic || null,
      preferredTimes: picked.map((iso) => ({ start: iso })),
      provider,
    });
    if (error) return setState('error');
    setState('done');
    onSubmitted?.();
  };

  if (state === 'done') {
    return (
      <motion.div {...collapse} className="rounded-3xl bg-moss-900/60 border border-spore-500/30 p-8 text-center"
        role="status" aria-live="polite">
        <div className="text-4xl mb-3" aria-hidden>🌱</div>
        <h3 className="font-display text-2xl text-spore-100">Your request is rippling outward</h3>
        <p className="mt-2 text-moss-200 max-w-sm mx-auto">
          {profile?.assigned_coach_name
            ? `${profile.assigned_coach_name} can see it now and will pick a time that works for both of you.`
            : 'Your Grace team can see it now and will connect you with a coach.'}{' '}
          You'll get a notification the moment it lands. No pressure, no rush.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      {...ripple}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="space-y-8"
      aria-label="Request a session"
    >
      {/* 1 · Type */}
      <fieldset>
        <legend className="font-display text-xl text-spore-100 mb-3">Who would help most right now?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {SESSION_TYPES.map((t) => (
            <button
              key={t.value} type="button"
              onClick={() => setType(t.value)}
              aria-pressed={type === t.value}
              className={`min-h-[88px] rounded-2xl border p-4 text-left transition-colors focus-visible:ring-4 ring-spore-400/60
                ${type === t.value
                  ? 'border-spore-400 bg-spore-500/15 shadow-glow'
                  : 'border-moss-700 bg-moss-900/40 hover:border-moss-500'}`}
            >
              <span className="block font-semibold text-spore-50 text-lg">{t.label}</span>
              <span className="block text-sm text-moss-300 mt-1">{t.sub}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* 2 · Topic (optional, voice-enabled) */}
      <div>
        <label className="font-display text-xl text-spore-100 mb-3 block" htmlFor="topic">
          Anything you'd like to explore? <span className="text-moss-400 text-base">(optional)</span>
        </label>
        <VoiceTextField
          id="topic" value={topic} onChange={setTopic}
          placeholder="Type or speak — whatever feels right…"
          rows={3}
        />
      </div>

      {/* 3 · Times */}
      <fieldset>
        <legend className="font-display text-xl text-spore-100 mb-1">Times that could work for you</legend>
        <p className="text-sm text-moss-300 mb-3">Pick a few — your coach will confirm one or suggest others.</p>
        <div className="flex flex-wrap gap-2">
          {slots.map((d) => {
            const iso = d.toISOString();
            const on = picked.includes(iso);
            return (
              <button key={iso} type="button" onClick={() => toggleSlot(iso)} aria-pressed={on}
                className={`min-h-[48px] px-4 rounded-full border text-sm transition-colors focus-visible:ring-4 ring-spore-400/60
                  ${on ? 'border-spore-400 bg-spore-500/20 text-spore-50' : 'border-moss-700 text-moss-200 hover:border-moss-500'}`}>
                {d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 4 · Meeting provider */}
      <fieldset>
        <legend className="text-moss-200 mb-2">Video preference</legend>
        <div className="flex gap-3" role="radiogroup">
          {['zoom', 'uma'].map((p) => (
            <button key={p} type="button" role="radio" aria-checked={provider === p}
              onClick={() => setProvider(p)}
              className={`min-h-[48px] px-5 rounded-full border capitalize focus-visible:ring-4 ring-spore-400/60
                ${provider === p ? 'border-spore-400 bg-spore-500/20 text-spore-50' : 'border-moss-700 text-moss-300'}`}>
              {p}
            </button>
          ))}
        </div>
      </fieldset>

      <AnimatePresence>
        {state === 'error' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-amber-300" role="alert">
            Something didn't save — you're not doing anything wrong. Please try once more.
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit" disabled={!canSubmit}
        whileTap={reduced ? undefined : { scale: 0.98 }}
        className="w-full min-h-[56px] rounded-2xl bg-spore-500 text-moss-950 font-semibold text-lg
                   disabled:opacity-40 disabled:cursor-not-allowed shadow-glow focus-visible:ring-4 ring-spore-300"
      >
        {state === 'saving' ? 'Sending…' : 'Send my request'}
      </motion.button>
      <p className="text-center text-sm text-moss-400">No fees. No stigma. Just grace.</p>
    </motion.form>
  );
}
