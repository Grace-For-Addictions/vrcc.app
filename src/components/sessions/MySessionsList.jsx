// components/sessions/MySessionsList.jsx — participant view of requests + scheduled sessions.
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { calendarLink, providerLabel } from '../../lib/meetings';
import SessionFeedbackForm from './SessionFeedbackForm';
import { useQuantumMotion } from '../../lib/quantumMotion';

const STATUS_COPY = {
  requested: 'sent to your coach 🌱',
  suggested: 'your coach suggested times',
  time_confirmed: 'time confirmed — scheduling…',
  accepted: 'accepted',
  declined: 'coach passed this one back',
  cancelled: 'cancelled',
};

export default function MySessionsList() {
  const { ripple } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const { myRequests, mySessions, fetchMine, acceptSuggestedTime, cancelRequest, subscribe } = useSessionStore();
  const [feedbackFor, setFeedbackFor] = useState(null);

  useEffect(() => {
    if (!profile) return;
    fetchMine();
    return subscribe();
  }, [profile?.id]);

  const fmt = (iso) => new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-8">
      {mySessions.length > 0 && (
        <section aria-labelledby="sess-h" className="space-y-3">
          <h3 id="sess-h" className="font-display text-xl text-spore-100">Scheduled sessions</h3>
          {mySessions.map((s) => (
            <motion.div key={s.id} {...ripple}
              className="rounded-2xl border border-spore-500/30 bg-moss-900/50 p-5 shadow-glow">
              <p className="text-spore-100 font-medium">
                {s.coach_name || 'Your coach'} · {s.scheduled_at ? fmt(s.scheduled_at) : 'time to be confirmed'}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {s.meeting_url && (
                  <a href={s.meeting_url} target="_blank" rel="noreferrer"
                     className="min-h-[48px] inline-flex items-center px-5 rounded-xl bg-spore-500 text-moss-950 font-semibold">
                    Join {providerLabel(s.meeting_provider)}
                  </a>
                )}
                {s.scheduled_at && (
                  <a href={calendarLink({ title: `GFA session with ${s.coach_name || 'coach'}`, startsAt: s.scheduled_at, url: s.meeting_url })}
                     target="_blank" rel="noreferrer"
                     className="min-h-[48px] inline-flex items-center px-5 rounded-xl border border-moss-600 text-moss-100">
                    Add to calendar
                  </a>
                )}
                {s.status === 'completed' && (
                  <button onClick={() => setFeedbackFor(s)}
                    className="min-h-[48px] px-5 rounded-xl border border-amber-300/50 text-amber-200">
                    Share how it went
                  </button>
                )}
              </div>
              {s.next_step && <p className="mt-3 text-sm text-lichen-200">Next step you agreed on: {s.next_step}</p>}
            </motion.div>
          ))}
        </section>
      )}

      <section aria-labelledby="req-h" className="space-y-3">
        <h3 id="req-h" className="font-display text-xl text-spore-100">Your requests</h3>
        {myRequests.length === 0 && <p className="text-moss-300">No requests yet — when you're ready, we're here.</p>}
        {myRequests.map((req) => (
          <div key={req.id} className="rounded-2xl border border-moss-700 bg-moss-900/40 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-moss-100 capitalize">{String(req.session_type || 'session').replace('_', ' ')}</p>
              <span className={`text-sm px-3 py-1 rounded-full
                ${req.status === 'requested' ? 'bg-amber-400/15 text-amber-200' : 'bg-spore-500/15 text-spore-200'}`}>
                {STATUS_COPY[req.status] || req.status}
              </span>
            </div>
            {req.topic && <p className="mt-2 text-sm text-moss-300">“{req.topic}”</p>}

            {req.status === 'suggested' && (req.suggested_times ?? []).length > 0 && (
              <div className="mt-4 space-y-2">
                {req.suggest_note && <p className="text-sm text-moss-200 italic">“{req.suggest_note}”</p>}
                <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested times">
                  {req.suggested_times.map((t) => (
                    <button key={t.start} onClick={() => acceptSuggestedTime(req, t.start)}
                      className="min-h-[48px] px-4 rounded-xl border border-spore-400 text-spore-100 hover:bg-spore-500/15">
                      {fmt(t.start)} works ✓
                    </button>
                  ))}
                </div>
              </div>
            )}

            {['requested', 'suggested'].includes(req.status) && (
              <button onClick={() => cancelRequest(req.id)}
                className="mt-3 min-h-[48px] px-4 rounded-xl text-moss-400 hover:text-moss-200 text-sm">
                Withdraw request
              </button>
            )}
          </div>
        ))}
      </section>

      {feedbackFor && (
        <SessionFeedbackForm session={feedbackFor} role="participant" onClose={() => setFeedbackFor(null)} />
      )}
    </div>
  );
}
