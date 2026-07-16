import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { ensureMyParticipant, soilForScore, displayName } from './lib';
import Intake from './Intake';
import Barc10 from './Barc10';
import Messaging from './Messaging';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart, LogOut, Loader2, UserCheck, Clock, CalendarDays, Sparkles, MessageCircle, Send,
} from 'lucide-react';

function fmtWhen(ts) {
  try {
    return new Date(ts).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return ts; }
}

export default function ParticipantApp({ user, onSignOut }) {
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const p = await ensureMyParticipant(user);
      setParticipant(p);
    } catch (err) {
      setError(err.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <FullSpinner />;
  if (error) return <ErrorScreen msg={error} onSignOut={onSignOut} />;

  if (!participant?.intake_complete)
    return <Intake user={user} participant={participant} onComplete={reload} />;
  if (!participant?.barc10_complete)
    return <Barc10 user={user} participant={participant} onComplete={reload} />;

  return <ParticipantHome user={user} participant={participant} onSignOut={onSignOut} />;
}

function ParticipantHome({ user, participant, onSignOut }) {
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [note, setNote] = useState('');
  const [requesting, setRequesting] = useState(false);
  const hasCoach = !!participant.assigned_coach_email;
  const soil = participant.barc10_score != null ? soilForScore(participant.barc10_score) : null;

  const loadSessions = useCallback(async () => {
    const { data: s } = await supabase
      .from('mvp_sessions')
      .select('*')
      .eq('participant_email', user.email)
      .order('scheduled_at', { ascending: true });
    setSessions(s || []);
    const { data: r } = await supabase
      .from('mvp_session_requests')
      .select('*')
      .eq('participant_email', user.email)
      .order('created_date', { ascending: false });
    setRequests(r || []);
  }, [user.email]);

  useEffect(() => {
    loadSessions();
    const t = setInterval(loadSessions, 6000);
    return () => clearInterval(t);
  }, [loadSessions]);

  const requestSession = async (e) => {
    e.preventDefault();
    setRequesting(true);
    await supabase.from('mvp_session_requests').insert({
      participant_id: participant.participant_id,
      participant_email: user.email,
      participant_name: `${participant.first_name} ${participant.last_name}`.trim(),
      coach_email: participant.assigned_coach_email,
      coach_name: participant.assigned_coach_name,
      note: note.trim() || null,
      status: 'pending',
    });
    setNote('');
    setRequesting(false);
    loadSessions();
  };

  const upcoming = sessions.filter((s) => s.status !== 'cancelled' && (!s.scheduled_at || new Date(s.scheduled_at) >= new Date(Date.now() - 3600e3)));
  const pendingReq = requests.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 via-white to-white">
      <Header title="My Recovery" subtitle={`Welcome back, ${displayName(participant)}`} onSignOut={onSignOut} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Recovery capital snapshot */}
        {soil && (
          <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-5 flex items-center gap-4">
            <div className="text-4xl">{soil.emoji}</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{soil.label} · {participant.barc10_score}/60</div>
              <div className="text-sm text-gray-500">{soil.description}</div>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
        )}

        {/* Coach */}
        <section className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-teal-600" /> Your coach
          </h2>
          {hasCoach ? (
            <>
              <div className="rounded-xl bg-teal-50/70 p-4 mb-4">
                <div className="font-medium text-gray-900">{participant.assigned_coach_name || participant.assigned_coach_email}</div>
                <div className="text-sm text-gray-500">Peer Recovery Coach · here to walk with you</div>
              </div>
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                <MessageCircle className="w-4 h-4 text-teal-600" /> Messages
              </h3>
              <Messaging
                participantEmail={user.email}
                participantId={participant.participant_id}
                me={{ email: user.email, name: displayName(participant), role: 'participant' }}
              />
            </>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0" />
              We’re matching you with a peer recovery coach. You’ll be able to message them here as
              soon as they connect with you — usually within a day or two. You belong here already. 💚
            </div>
          )}
        </section>

        {/* Sessions */}
        <section className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-teal-600" /> Sessions
          </h2>

          {upcoming.length > 0 ? (
            <div className="space-y-2 mb-5">
              {upcoming.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {s.scheduled_at ? fmtWhen(s.scheduled_at) : 'Time to be confirmed'}
                    </div>
                    <div className="text-sm text-gray-500">with {s.coach_name || s.coach_email}</div>
                  </div>
                  <span className="text-xs font-medium text-teal-700 bg-teal-50 rounded-full px-2.5 py-1 capitalize">{s.status || 'scheduled'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-5">No sessions scheduled yet.</p>
          )}

          {hasCoach ? (
            <form onSubmit={requestSession} className="border-t pt-4">
              <label className="text-sm font-medium text-gray-700">Request a session with your coach</label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What would you like to talk about? (optional)" className="mt-2" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {pendingReq.length > 0 ? `${pendingReq.length} request${pendingReq.length > 1 ? 's' : ''} pending — your coach will set a time.` : 'Your coach picks the day & time.'}
                </span>
                <Button type="submit" disabled={requesting} className="bg-teal-600 hover:bg-teal-700">
                  {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" /> Request</>}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-gray-400 border-t pt-4">You can request sessions once you’re matched with a coach.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Header({ title, subtitle, onSignOut }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-teal-100/60">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-gray-900 text-sm">{title}</div>
            <div className="text-xs text-teal-600">{subtitle}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut} className="text-gray-500">
          <LogOut className="w-4 h-4 mr-1.5" /> Sign out
        </Button>
      </div>
    </header>
  );
}

function FullSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

function ErrorScreen({ msg, onSignOut }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-red-600 max-w-md">{msg}</p>
      <Button variant="outline" onClick={onSignOut}>Sign out</Button>
    </div>
  );
}

export { Header, FullSpinner };
