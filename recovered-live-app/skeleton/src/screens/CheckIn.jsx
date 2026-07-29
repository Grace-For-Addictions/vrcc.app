import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ui } from '../lib/api';
import { useParticipant, useAsync } from '../lib/hooks';
import { isConfigured } from '../lib/supabase';
import ScreenFrame, { Offline, Loading, ErrorBox } from '../components/ScreenFrame';

const MOODS = [
  { score: 2, label: 'Struggling', emoji: '🌧️' },
  { score: 4, label: 'Low', emoji: '⛅' },
  { score: 6, label: 'Okay', emoji: '🌤️' },
  { score: 8, label: 'Good', emoji: '☀️' },
  { score: 10, label: 'Thriving', emoji: '🌈' },
];

// Check-In → gfa_ui.check_in_records. Required columns: date (date), mood_score
// (numeric). Also mood_label, note, safety_flag, check_in_method. Shows the last
// 14 check-ins as a mood trend (Recharts).
export default function CheckIn() {
  if (!isConfigured()) return <ScreenFrame title="Daily Check-In" group="Wellness"><Offline /></ScreenFrame>;
  return <CheckInLive />;
}

function CheckInLive() {
  const me = useParticipant();
  const history = useAsync(async () => {
    if (!me.profile) return [];
    const { data, error } = await ui('check_in_records')
      .select('date, mood_score, mood_label, note, safety_flag')
      .eq('participant_id', me.profile.id)
      .order('date', { ascending: false })
      .limit(14);
    if (error) throw error;
    return data || [];
  }, [me.profile?.id]);

  if (me.loading || history.loading) return <ScreenFrame title="Daily Check-In" group="Wellness"><Loading /></ScreenFrame>;
  if (history.error) return <ScreenFrame title="Daily Check-In" group="Wellness"><ErrorBox msg={history.error} /></ScreenFrame>;

  return <CheckInView profile={me.profile} history={history.data || []} onSaved={history.reload} />;
}

function CheckInView({ profile, history, onSaved }) {
  const [mood, setMood] = useState(6);
  const [note, setNote] = useState('');
  const [safety, setSafety] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);
  const picked = MOODS.reduce((a, b) => (Math.abs(b.score - mood) < Math.abs(a.score - mood) ? b : a));

  const submit = async () => {
    if (!profile) { setErr('Sign in to check in.'); return; }
    setBusy(true); setErr(null);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await ui('check_in_records').insert({
      participant_id: profile.id, date: today,
      mood_score: mood, mood_label: picked.label, note: note || null,
      safety_flag: safety, check_in_method: 'web',
    });
    setBusy(false);
    if (error) setErr(error.message); else { setDone(true); setNote(''); onSaved(); }
  };

  const trend = [...history].reverse().map((r) => ({ date: (r.date || '').slice(5), mood: Number(r.mood_score) }));

  return (
    <ScreenFrame title="How are you today?" group="Wellness"
      subtitle="One honest moment. There's no wrong answer — showing up is the win.">
      <div className="card">
        <div className="mood-row">
          {MOODS.map((m) => (
            <button key={m.score} className={`mood ${picked.score === m.score ? 'mood--on' : ''}`} onClick={() => setMood(m.score)} type="button">
              <span className="mood__emoji">{m.emoji}</span><span className="mood__label">{m.label}</span>
            </button>
          ))}
        </div>
        <input type="range" min="1" max="10" step="1" value={mood} onChange={(e) => setMood(Number(e.target.value))} className="slider" />
        <div className="muted small center">Mood {mood}/10 — {picked.label}</div>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything you want to note? (optional)" />
        <label className="checkline"><input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} />
          <span>I could use a safety check-in from my coach.</span></label>
        {err && <ErrorBox msg={err} />}
        <button className="btn" disabled={busy} onClick={submit}>{busy ? 'Saving…' : done ? 'Checked in ✓ — check in again' : 'Check in'}</button>
      </div>

      {trend.length > 1 && (
        <div className="card">
          <h2>Your recent mood</h2>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9a93b4' }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#9a93b4' }} />
                <Tooltip contentStyle={{ background: '#0d0b18', border: '1px solid #241f36', borderRadius: 8 }} />
                <Line type="monotone" dataKey="mood" stroke="#1fb6b6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}
