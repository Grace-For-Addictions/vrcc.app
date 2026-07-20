import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { soilForScore, attentionFor } from './lib';
import Messaging from './Messaging';
import { Header, FullSpinner } from './ParticipantApp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, UserPlus, Inbox, CalendarDays, Loader2, ArrowLeft, MessageCircle,
  CheckCircle2, Clock, AlertCircle, ClipboardList, Save, Target,
} from 'lucide-react';

const TONE = {
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-600',
};
const ORDER = { overdue: 0, new: 1, quiet: 2, no_followup: 3 };

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
  const [tab, setTab] = useState('attention');
  const [unmatched, setUnmatched] = useState([]);
  const [mine, setMine] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // participant detail panel

  const coachName = coach?.name || user.user_metadata?.first_name || user.email;

  const load = useCallback(async () => {
    const [{ data: um }, { data: mn }, { data: rq }, { data: ss }, { data: ob }] = await Promise.all([
      supabase.from('participants').select('*').is('assigned_coach_email', null).eq('intake_complete', true).order('created_at', { ascending: true }),
      supabase.from('participants').select('*').eq('assigned_coach_email', user.email).order('first_name', { ascending: true }),
      supabase.from('mvp_session_requests').select('*').eq('coach_email', user.email).order('created_date', { ascending: false }),
      supabase.from('mvp_sessions').select('*').eq('coach_email', user.email).order('scheduled_at', { ascending: true }),
      // Signups who haven't finished onboarding — otherwise invisible to everyone.
      supabase.from('participants').select('*').is('assigned_coach_email', null).eq('intake_complete', false).order('created_at', { ascending: false }),
    ]);
    setUnmatched(um || []);
    setMine(mn || []);
    setRequests(rq || []);
    setSessions(ss || []);
    setOnboarding(ob || []);
    setLoading(false);
  }, [user.email]);

  // Mark a scheduled session complete; completing it counts as a contact.
  const markComplete = async (s) => {
    await supabase.from('mvp_sessions').update({ status: 'completed' }).eq('id', s.id);
    if (s.participant_id) {
      await supabase.from('participants').update({ last_contact_at: new Date().toISOString() }).eq('participant_id', s.participant_id);
    }
    load();
  };

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
  const upcoming = sessions.filter((s) => s.status !== 'cancelled' && s.status !== 'completed');
  const attentionList = mine
    .map((p) => ({ p, a: attentionFor(p) }))
    .filter((x) => x.a)
    .sort((x, y) => ORDER[x.a.level] - ORDER[y.a.level]);

  const tabs = [
    { key: 'attention', label: 'Needs attention', icon: AlertCircle, count: attentionList.length },
    { key: 'mine', label: 'My participants', icon: Users, count: mine.length },
    { key: 'unmatched', label: 'Unmatched', icon: UserPlus, count: unmatched.length },
    { key: 'requests', label: 'Requests', icon: Inbox, count: pendingReqs.length },
    { key: 'upcoming', label: 'Upcoming', icon: CalendarDays, count: upcoming.length },
    { key: 'onboarding', label: 'Onboarding', icon: ClipboardList, count: onboarding.length },
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

        {tab === 'attention' && (
          <List empty="Everyone’s connection is current. Beautiful work. 🌱">
            {attentionList.map(({ p, a }) => {
              const soil = p.barc10_score != null ? soilForScore(p.barc10_score) : null;
              return (
                <Row key={p.participant_id}
                  title={pName(p)}
                  subtitle={<span className="flex items-center gap-2">
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${TONE[a.tone]}`}>{a.label}</span>
                    {soil && <span className="text-gray-400">{soil.emoji} {p.barc10_score}/60</span>}
                    {p.next_follow_up_due && <span className="text-gray-400">due {new Date(p.next_follow_up_due).toLocaleDateString()}</span>}
                  </span>}
                  action={<Button size="sm" variant="outline" onClick={() => setActive(p)}><MessageCircle className="w-4 h-4 mr-1.5" /> Open</Button>}
                />
              );
            })}
          </List>
        )}

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
              const a = attentionFor(p);
              return (
                <Row key={p.participant_id}
                  title={pName(p)}
                  subtitle={<span className="flex items-center gap-2">
                    {a && <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${TONE[a.tone]}`}>{a.label}</span>}
                    <span className="text-gray-500">{soil ? `${soil.emoji} ${soil.label} · ${p.barc10_score}/60` : 'Recovery check-in pending'}</span>
                  </span>}
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
                action={<Button size="sm" variant="outline" onClick={() => markComplete(s)}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark done
                </Button>}
              />
            ))}
          </List>
        )}

        {tab === 'onboarding' && (
          <List empty="No one is mid-signup right now.">
            {onboarding.map((p) => (
              <Row key={p.participant_id}
                title={pName(p)}
                subtitle={`Signed up ${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''} · hasn’t finished intake`}
                action={<span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">In progress</span>}
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
  const [nextStep, setNextStep] = useState(participant.current_next_step || '');
  const [followUp, setFollowUp] = useState(participant.next_follow_up_due || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [lastContact, setLastContact] = useState(participant.last_contact_at || null);

  const save = async () => {
    setBusy(true);
    setSaved(false);
    setErr('');
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('participants')
      .update({
        current_next_step: nextStep.trim() || null,
        next_follow_up_due: followUp || null,
        last_contact_at: nowIso,
      })
      .eq('participant_id', participant.participant_id);
    setBusy(false);
    if (error) {
      setErr(error.message || 'Could not save. Is the Gate 19B migration applied?');
      return;
    }
    setSaved(true);
    setLastContact(nowIso);
    if (onChange) onChange();
  };

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

      {/* Agreed next step & follow-up — powers the participant's home + the attention queue */}
      <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-teal-600" /> Agreed next step & follow-up
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Saving logs today as your last contact and shows this step on {participant.first_name && participant.first_name !== '—' ? participant.first_name : 'their'}’s home.
        </p>
        <label className="text-sm font-medium text-gray-700">Next step you agreed on</label>
        <Textarea value={nextStep} onChange={(e) => setNextStep(e.target.value)} rows={2}
          placeholder="e.g., Call the housing navigator on Tuesday" className="mt-1 mb-3" />
        <label className="text-sm font-medium text-gray-700">Follow up by</label>
        <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="mt-1 mb-4 sm:max-w-xs" />
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={save} disabled={busy} className="bg-teal-600 hover:bg-teal-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> Save &amp; log contact</>}
          </Button>
          {saved && <span className="text-sm text-teal-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
          {lastContact && <span className="text-xs text-gray-400 ml-auto">Last contact {new Date(lastContact).toLocaleDateString()}</span>}
        </div>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
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
