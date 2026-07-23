// components/sessions/CoachRequestQueue.jsx — a coach's incoming requests.
// Full flexibility, zero pressure: accept a proposed time, suggest alternates
// with a kind note, or pass it back — only what genuinely works for them.
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { providerLabel } from '../../lib/meetings';

function RequestCard({ req }) {
  const { coachAccept, coachSuggest, coachDecline, completeSession } = useSessionStore();
  const { ripple } = useQuantumMotion();
  const [mode, setMode] = useState(null); // 'suggest' | 'decline'
  const [times, setTimes] = useState(['', '']);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const fmt = (iso) => new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const act = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); setMode(null); } };

  return (
    <motion.div {...ripple} className="rounded-2xl border border-moss-700 bg-moss-900/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-spore-100 font-medium">{req.participant_name || req.participant_email}</p>
          <p className="text-sm text-moss-300 capitalize">{String(req.session_type || '').replace('_', ' ')} · prefers {providerLabel(req.meeting_provider)}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full
          ${req.status === 'requested' ? 'bg-amber-400/15 text-amber-200' : 'bg-spore-500/15 text-spore-200'}`}>
          {req.status === 'time_confirmed' ? 'they confirmed a time ✓' : req.status}
        </span>
      </div>
      {(req.topic || req.note) && <p className="text-moss-200 text-sm">“{req.topic || req.note}”</p>}

      {(req.preferred_times ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Accept a proposed time">
          {req.preferred_times.map((t) => (
            <button key={t.start} disabled={busy} onClick={() => act(() => coachAccept(req, t.start))}
              className="min-h-[48px] px-4 rounded-xl bg-spore-500 text-moss-950 font-semibold disabled:opacity-50">
              Accept {fmt(t.start)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setMode(mode === 'suggest' ? null : 'suggest')}
          className="min-h-[48px] px-4 rounded-xl border border-moss-600 text-moss-100">Suggest other times</button>
        <button onClick={() => setMode(mode === 'decline' ? null : 'decline')}
          className="min-h-[48px] px-4 rounded-xl text-moss-400 hover:text-moss-200">Pass with a note</button>
      </div>

      {mode === 'suggest' && (
        <div className="space-y-3 rounded-xl border border-spore-500/20 p-4">
          {times.map((t, i) => (
            <input key={i} type="datetime-local" value={t} aria-label={`Alternate time ${i + 1}`}
              onChange={(e) => setTimes((ts) => ts.map((x, j) => (j === i ? e.target.value : x)))}
              className="min-h-[48px] w-full rounded-xl bg-moss-950 border border-moss-700 px-4 text-moss-100" />
          ))}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Optional kind note — e.g. mornings are gentler for me this week"
            className="w-full rounded-xl bg-moss-950 border border-moss-700 p-4 text-moss-100" />
          <button disabled={busy || !times.some(Boolean)}
            onClick={() => act(() => coachSuggest(req, times.filter(Boolean).map((t) => ({ start: new Date(t).toISOString() })), note))}
            className="min-h-[48px] px-5 rounded-xl bg-spore-500 text-moss-950 font-semibold disabled:opacity-50">
            Send suggestions
          </button>
        </div>
      )}

      {mode === 'decline' && (
        <div className="space-y-3 rounded-xl border border-moss-700 p-4">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Optional note — the participant will be gently notified"
            className="w-full rounded-xl bg-moss-950 border border-moss-700 p-4 text-moss-100" />
          <button disabled={busy} onClick={() => act(() => coachDecline(req, note))}
            className="min-h-[48px] px-5 rounded-xl border border-moss-600 text-moss-200">Pass this back</button>
        </div>
      )}
    </motion.div>
  );
}

export default function CoachRequestQueue() {
  const profile = useAuthStore((s) => s.profile);
  const { coachQueue, coachSessions, fetchCoachQueue, completeSession, subscribe } = useSessionStore();

  useEffect(() => {
    if (!profile) return;
    fetchCoachQueue();
    return subscribe();
  }, [profile?.id]);

  const upcoming = coachSessions.filter((s) => s.status === 'scheduled');
  const fmt = (iso) => new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-10">
      <section aria-labelledby="queue-h" className="space-y-3">
        <h2 id="queue-h" className="font-display text-2xl text-spore-100">Requests for you</h2>
        <p className="text-moss-300 text-sm">Only say yes to what genuinely works. Passing is always okay — grace covers coaches too.</p>
        {coachQueue.length === 0 && <p className="text-moss-300">No session requests waiting. 🌿</p>}
        {coachQueue.map((req) => <RequestCard key={req.id} req={req} />)}
      </section>

      <section aria-labelledby="up-h" className="space-y-3">
        <h2 id="up-h" className="font-display text-2xl text-spore-100">Your upcoming sessions</h2>
        {upcoming.length === 0 && <p className="text-moss-300">No sessions scheduled yet.</p>}
        {upcoming.map((s) => (
          <div key={s.id} className="rounded-2xl border border-spore-500/30 bg-moss-900/50 p-5">
            <p className="text-spore-100">{s.participant_name || s.participant_email} · {s.scheduled_at ? fmt(s.scheduled_at) : 'TBC'}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {s.meeting_url && (
                <a href={s.meeting_url} target="_blank" rel="noreferrer"
                   className="min-h-[48px] inline-flex items-center px-5 rounded-xl bg-spore-500 text-moss-950 font-semibold">Join</a>
              )}
              <button onClick={() => {
                  const nextStep = window.prompt('Next step you agreed on (optional):') || null;
                  completeSession(s.id, null, nextStep, null);
                }}
                className="min-h-[48px] px-5 rounded-xl border border-moss-600 text-moss-100">Mark completed</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
