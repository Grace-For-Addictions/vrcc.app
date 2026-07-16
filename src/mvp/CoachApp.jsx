import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { soilForScore } from './lib';
import Messaging from './Messaging';
import { Header, FullSpinner } from './ParticipantApp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, UserPlus, Inbox, CalendarDays, Loader2, ArrowLeft, MessageCircle,
  CheckCircle2, Clock,
} from 'lucide-react';

function fmtWhen(ts) {
  try {
    return new Date(ts).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return ts; }
}
const pName = (p) => `${p.first_name || ''} ${p.last_name || ''}`.replace(/—/g, '').trim() || p.email || 'Participant';

export default function CoachApp({ user, onSignOut }) {
  const [coach, setCoach] = useState(null);
  const [tab, setTab] = useState('unmatched');
  const [unmatched, setUnmatched] = useState([]);
  const [mine, setMine] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // participant detail panel

  const coachName = coach?.name || user.user_metadata?.first_name || user.email;

  const load = useCallback(async () => {
    const [{ data: um }, { data: mn }, { data: rq }, { data: ss }] = await Promise.all([
      supabase.from('participants').select('*').is('assigned_coach_email', null).eq('intake_complete', true).order('created_at', { ascending: true }),
      supabase.from('participants').select('*').eq('assigned_coach_email', user.email).order('first_name', { ascending: true }),
      supabase.from('mvp_session_requests').select('*').eq('coach_email', user.email).order('created_date', { ascending: false }),
      supabase.from('mvp_sessions').select('*').eq('coach_email', user.email).order('scheduled_at', { ascending: true }),
    ]);
    setUnmatched(um || []);
    setMine(mn || []);
    setRequests(rq || []);
    setSessions(ss || []);
    setLoading(false);
  }, [user.email]);

  useEffect(() => {
    // Resolve coach display name from peer_coaches if present.
    (async () => {
      const { data } = await supabase.from('peer_coaches').select('first_name,last_name,preferred_name').eq('supabase_user_id', user.id).maybeSingle();
      if (data) setCoach({ name: data.preferred_name || `${data.first_name} ${data.last_name}`.trim() });
    })();
  }, [user.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  const claim = async (p) => {
    await supabase
      .from('participants')
      .update({ assigned_coach_email: user.email, assigned_coach_name: coachName })
      .eq('participant_id', p.participant_id);
    load();
  };

  if (loading) return <FullSpinner />;

  if (active) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/50 to-white">
        <Header title="Coach" subtitle={coachName} onSignOut={onSignOut} />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={() => setActive(null)} className="inline-flex items-center gap-1.5 text-sm text-teal-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to caseload
          </button>
          <ParticipantPanel participant={active} coachEmail={user.email} coachName={coachName} onChange={load} />
        </div>
      </div>
    );
  }

  const pendingReqs = requests.filter((r) => r.status === 'pending');
  const upcoming = sessions.filter((s) => s.status !== 'cancelled');

  const tabs = [
    { key: 'unmatched', label: 'Unmatched', icon: UserPlus, count: unmatched.length },
    { key: 'mine', label: 'My participants', icon: Users, count: mine.length },
    { key: 'requests', label: 'Requests', icon: Inbox, count: pendingReqs.length },
    { key: 'upcoming', label: 'Upcoming', icon: CalendarDays, count: upcoming.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 to-white">
      <Header title="Coach Dashboard" subtitle={coachName} onSignOut={onSignOut} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
              {t.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 ${tab === t.key ? 'bg-white/25' : 'bg-teal-100 text-teal-700'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'unmatched' && (
          <List empty="No one is waiting to be matched right now. 🌱">
            {unmatched.map((p) => {
              const soil = p.barc10_score != null ? soilForScore(p.barc10_score) : null;
              return (
                <Row key={p.participant_id}
                  title={pName(p)}
                  subtitle={`${p.city || 'Iowa'}${soil ? ` · ${soil.emoji} ${soil.label} (${p.barc10_score}/60)` : ' · check-in pending'}`}
                  action={<Button size="sm" onClick={() => claim(p)} className="bg-teal-600 hover:bg-teal-700"><UserPlus className="w-4 h-4 mr-1.5" /> Claim</Button>}
                />
              );
            })}
          </List>
        )}

        {tab === 'mine' && (
          <List empty="Claim a participant from the Unmatched tab to start walking with them.">
            {mine.map((p) => {
              const soil = p.barc10_score != null ? soilForScore(p.barc10_score) : null;
              return (
                <Row key={p.participant_id}
                  title={pName(p)}
                  subtitle={soil ? `${soil.emoji} ${soil.label} · ${p.barc10_score}/60` : 'Recovery check-in pending'}
                  action={<Button size="sm" variant="outline" onClick={() => setActive(p)}><MessageCircle className="w-4 h-4 mr-1.5" /> Open</Button>}
                />
              );
            })}
          </List>
        )}

        {tab === 'requests' && (
          <List empty="No session requests waiting.">
            {pendingReqs.map((r) => (
              <RequestRow key={r.id} req={r} coachEmail={user.email} coachName={coachName} onDone={load} />
            ))}
          </List>
        )}

        {tab === 'upcoming' && (
          <List empty="No sessions scheduled yet.">
            {upcoming.map((s) => (
              <Row key={s.id}
                title={s.participant_name || s.participant_email}
                subtitle={s.scheduled_at ? fmtWhen(s.scheduled_at) : 'Time to be confirmed'}
                action={<span className="text-xs font-medium text-teal-700 bg-teal-50 rounded-full px-2.5 py-1 capitalize">{s.status || 'scheduled'}</span>}
              />
            ))}
          </List>
        )}
      </div>
    </div>
  );
}

function List({ children, empty }) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return <div className="text-center text-sm text-gray-400 py-16">{empty}</div>;
  return <div className="space-y-2">{children}</div>;
}

function Row({ title, subtitle, action }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700">
        {(title || '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{title}</div>
        <div className="text-sm text-gray-500 truncate">{subtitle}</div>
      </div>
      {action}
    </div>
  );
}

function RequestRow({ req, coachEmail, coachName, onDone }) {
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const schedule = async () => {
    if (!when) return;
    setBusy(true);
    await supabase.from('mvp_sessions').insert({
      request_id: req.id,
      participant_id: req.participant_id,
      participant_email: req.participant_email,
      participant_name: req.participant_name,
      coach_email: coachEmail,
      coach_name: coachName,
      scheduled_at: new Date(when).toISOString(),
      status: 'scheduled',
    });
    await supabase.from('mvp_session_requests').update({ status: 'scheduled' }).eq('id', req.id);
    setBusy(false);
    onDone();
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-amber-500" />
        <span className="font-medium text-gray-900">{req.participant_name || req.participant_email}</span>
      </div>
      {req.note && <p className="text-sm text-gray-600 mb-3">“{req.note}”</p>}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="sm:max-w-xs" />
        <Button size="sm" onClick={schedule} disabled={busy || !when} className="bg-teal-600 hover:bg-teal-700">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Schedule</>}
        </Button>
      </div>
    </div>
  );
}

function ParticipantPanel({ participant, coachEmail, coachName, onChange }) {
  const soil = participant.barc10_score != null ? soilForScore(participant.barc10_score) : null;
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-xl font-bold text-teal-700">
            {pName(participant).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{pName(participant)}</h2>
            <div className="text-sm text-gray-500">
              {participant.city || 'Iowa'}{participant.pronouns ? ` · ${participant.pronouns}` : ''}
            </div>
          </div>
        </div>
        {soil && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-teal-50/70 p-3">
            <span className="text-2xl">{soil.emoji}</span>
            <div className="text-sm"><span className="font-medium text-gray-900">{soil.label}</span> · {participant.barc10_score}/60 recovery capital</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-teal-600" /> Messages
        </h3>
        <Messaging
          participantEmail={participant.email}
          participantId={participant.participant_id}
          me={{ email: coachEmail, name: coachName, role: 'coach' }}
        />
      </div>
    </div>
  );
}
