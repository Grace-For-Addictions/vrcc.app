// src/components/housing/ApplicationReviewList.jsx
// Navigator/house-manager queue: review applications, schedule virtual intake (Zoom/Ooma Office).

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useHousingStore } from '../../stores/useHousingStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { calendarLink } from '../../lib/meetings';

const fmt = (iso) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function AppCard({ app }) {
  const { collapse } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const { scheduleIntake, setApplicationStatus, fetchAdminApplications } = useHousingStore();
  const [when, setWhen] = useState('');
  const [provider, setProvider] = useState('zoom');
  const [busy, setBusy] = useState(false);

  const doSchedule = async () => {
    setBusy(true);
    const url = window.prompt('Paste the Ooma Office (or Zoom) link for this intake — e.g. the house intake room (leave blank to add later):') || null;
    await scheduleIntake(app.id, new Date(when).toISOString(), provider, url);
    await fetchAdminApplications();
    setBusy(false);
  };

  const move = async (status) => { await setApplicationStatus(app.id, status); await fetchAdminApplications(); };

  return (
    <motion.li {...collapse} className="rounded-3xl border border-moss-700 bg-moss-900/50 p-6 space-y-4">
      <header className="flex flex-wrap justify-between gap-2">
        <div>
          <h3 className="font-display text-xl text-spore-100">{app.personal?.full_name ?? app.applicant?.display_name}</h3>
          <p className="text-moss-300 text-sm">{app.entry_name || 'Program'} · {app.county || app.personal?.county || '—'} County
            · submitted {app.submitted_at ? fmt(app.submitted_at) : '—'}</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-moss-800 text-moss-200 capitalize h-fit">{app.status.replace(/_/g, ' ')}</span>
      </header>

      {app.your_why && (
        <blockquote className="border-l-2 border-spore-500/60 pl-4 text-moss-100 italic">
          “{app.your_why}”
        </blockquote>
      )}
      {app.recovery_journey && <p className="text-moss-200 text-sm whitespace-pre-wrap">{app.recovery_journey}</p>}
      <p className="text-moss-400 text-xs">
        Pathway: {app.pathway ?? '—'} · Contact preference: {app.consent_contact_method}
      </p>

      {['submitted', 'under_review'].includes(app.status) && (
        <div className="rounded-2xl bg-moss-950/60 p-4 space-y-3">
          <p className="text-moss-200 font-medium">Schedule virtual intake</p>
          <div className="flex flex-wrap gap-3 items-center">
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
              aria-label="Intake date and time"
              className="min-h-[48px] rounded-xl bg-moss-900 border border-moss-700 px-4 text-moss-100" />
            <select value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Video provider"
              className="min-h-[48px] rounded-xl bg-moss-900 border border-moss-700 px-4 text-moss-100">
              <option value="zoom">Zoom</option>
              <option value="uma">Ooma Office</option>
            </select>
            <button onClick={doSchedule} disabled={!when || busy}
              className="min-h-[48px] px-5 rounded-xl bg-spore-500 text-moss-950 font-semibold disabled:opacity-40">
              {busy ? 'Creating link…' : 'Schedule intake'}
            </button>
          </div>
        </div>
      )}

      {app.status === 'intake_scheduled' && (
        <div className="flex flex-wrap gap-3 items-center">
          <p className="text-spore-100">Intake · {fmt(app.intake_at)}</p>
          <a href={app.intake_url} target="_blank" rel="noreferrer"
            className="min-h-[48px] inline-flex items-center px-4 rounded-xl bg-spore-500 text-moss-950 font-semibold">
            Join {app.intake_provider}
          </a>
          <a href={calendarLink({ title: 'Grace House Intake', startsAt: app.intake_at, url: app.intake_url })}
            target="_blank" rel="noreferrer"
            className="min-h-[48px] inline-flex items-center px-4 rounded-xl border border-moss-600 text-moss-100">
            Add to calendar
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {[['under_review', 'Reviewing'], ['accepted', 'Accept 💚'], ['waitlisted', 'Waitlist'], ['declined', 'Decline gently']].map(([s, label]) => (
          <button key={s} onClick={() => move(s)}
            className="min-h-[44px] px-4 rounded-xl border border-moss-600 text-moss-200 text-sm hover:border-spore-400">
            {label}
          </button>
        ))}
      </div>
    </motion.li>
  );
}

export default function ApplicationReviewList({ programId }) {
  const { adminApplications, fetchAdminApplications } = useHousingStore();
  useEffect(() => { fetchAdminApplications(); }, [programId]);

  return (
    <section aria-labelledby="apps-h" className="space-y-4">
      <h2 id="apps-h" className="font-display text-2xl text-spore-100">Applications</h2>
      {adminApplications.length === 0
        ? <p className="text-moss-400">No applications right now.</p>
        : <ul className="space-y-4">{adminApplications.map((a) => <AppCard key={a.id} app={a} />)}</ul>}
    </section>
  );
}
