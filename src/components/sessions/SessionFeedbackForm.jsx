// src/components/sessions/SessionFeedbackForm.jsx
// Post-session feedback + follow-up suggestions. Warm, brief, optional depth.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { VoiceTextField } from '../shared/VoiceTextField';

export default function SessionFeedbackForm({ requestId, onDone }) {
  const { collapse } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const submitFeedback = useSessionStore((s) => s.submitFeedback);

  const [rating, setRating] = useState(0);
  const [feltHeard, setFeltHeard] = useState(null);
  const [reflection, setReflection] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [wantsFollowup, setWantsFollowup] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    await submitFeedback({
      requestId, authorId: profile.id, rating: rating || null,
      feltHeard, reflection: reflection || null,
      followUp: followUp || null, wantsFollowup,
    });
    setDone(true); onDone?.();
  };

  if (done) {
    return (
      <motion.p {...collapse} className="text-spore-200 text-center py-6" role="status">
        Thank you. Every reflection strengthens the whole network. 🍄
      </motion.p>
    );
  }

  return (
    <motion.div {...collapse} className="space-y-6">
      <div>
        <p className="font-display text-lg text-spore-100 mb-2">How was this session for you?</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Session rating, 1 to 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={rating === n} onClick={() => setRating(n)}
              className={`h-12 w-12 rounded-full border text-lg focus-visible:ring-4 ring-spore-400/60
                ${rating >= n ? 'border-spore-400 bg-spore-500/20 text-spore-100' : 'border-moss-700 text-moss-400'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-moss-200 mb-2">Did you feel heard?</p>
        <div className="flex gap-3">
          {[['Yes', true], ['Not fully', false]].map(([label, v]) => (
            <button key={label} onClick={() => setFeltHeard(v)} aria-pressed={feltHeard === v}
              className={`min-h-[48px] px-5 rounded-full border
                ${feltHeard === v ? 'border-spore-400 bg-spore-500/20 text-spore-100' : 'border-moss-700 text-moss-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <VoiceTextField value={reflection} onChange={setReflection} rows={3}
        label="Anything you want to remember from this session? (optional)"
        placeholder="Type or speak…" />

      <VoiceTextField value={followUp} onChange={setFollowUp} rows={2}
        label="Follow-up ideas — resources, topics, cadence (optional)"
        placeholder="e.g., meet again in two weeks; explore BARC housing domain…" />

      <label className="flex items-center gap-3 min-h-[48px] text-moss-100">
        <input type="checkbox" checked={wantsFollowup} onChange={(e) => setWantsFollowup(e.target.checked)}
          className="h-6 w-6 rounded accent-spore-500" />
        I'd like a follow-up session
      </label>

      <button onClick={submit}
        className="w-full min-h-[56px] rounded-2xl bg-spore-500 text-moss-950 font-semibold text-lg shadow-glow">
        Share feedback
      </button>
    </motion.div>
  );
}
